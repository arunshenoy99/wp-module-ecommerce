import { useEffect, useState } from '@wordpress/element';
import useSWR from 'swr';
import {
  Endpoints,
  queuePluginInstall,
  updateWCOnboarding,
  updateWPSettings,
} from '../services';

const isEmpty = (object) => Object.keys(object).length === 0;

const HighProductVolumes = ['11-100', '101-1000', '1000+'];

export function useOnboardingCleanup(hash) {
  let [cleanupStatus, setCleanupStatus] = useState(false);
  let { data: flow, error: flowError } = useSWR('/newfold-onboarding/v1/flow');
  let { data: settings, error: settingsError } = useSWR(Endpoints.WP_SETTINGS);
  useEffect(async () => {
    if (flow && settings && hash) {
      setCleanupStatus(true);
      let flowCheckpoint = flow.updatedAt ?? flow.createdAt;
      let previousCheckpoint = Number(
        settings['nfd-ecommerce-onboarding-check']
      );
      if (isNaN(previousCheckpoint) || previousCheckpoint < flowCheckpoint) {
        let { productInfo } = flow.storeDetails;
        let wcOnboardingProfile = {};
        if (productInfo.product_count !== '') {
          wcOnboardingProfile.product_count = productInfo.product_count;
        }
        if (productInfo.product_types?.length > 0) {
          wcOnboardingProfile.product_types = productInfo.product_types;
        }
        if (!isEmpty(wcOnboardingProfile)) {
          wcOnboardingProfile.completed = true;
          await updateWCOnboarding(wcOnboardingProfile);
        }
        setCleanupStatus(false);
        if (HighProductVolumes.includes(productInfo.product_count)) {
          await queuePluginInstall(
            'nfd_slug_yith_woocommerce_ajax_product_filter',
            { hash }
          );
          await queuePluginInstall('yith-woocommerce-ajax-search', { hash });
        }
        for (const product_type of productInfo.product_types) {
          if (product_type === 'physical') {
            await queuePluginInstall(
              'nfd_slug_yith_shippo_shippings_for_woocommerce',
              { hash }
            );
          }
          if (product_type === 'bookings') {
            await queuePluginInstall('nfd_slug_yith_woocommerce_booking', {
              hash,
            });
          }
        }
        await updateWPSettings({
          'nfd-ecommerce-onboarding-check': String(flowCheckpoint),
        });
      } else {
        setCleanupStatus(false);
      }
    }
    if (flowError || settingsError) {
      setCleanupStatus(false);
    }
  }, [flow, settings, hash]);
  return cleanupStatus;
}
