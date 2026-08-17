import { supabase } from './supabaseClient';
import { getUserPreferences } from './recommendationEngine';

// 🔴 মাস্টার সুইচ: এখন বন্ধ রাখা হলো (ভবিষ্যতে চালু করতে true করে দেবেন)
export const ENABLE_SPONSORED_ADS = false;

/**
 * ১. একটিভ বিজ্ঞাপনগুলো ফেচ করা ও ইউজারের পছন্দের সাথে ম্যাচ করা
 */
export async function getTargetedAds() {
  if (!ENABLE_SPONSORED_ADS) return [];

  const userPrefs = getUserPreferences();
  const topCategory = Object.keys(userPrefs.categories || {}).sort((a, b) => userPrefs.categories[b] - userPrefs.categories[a])[0] || 'সব';

  try {
    // ডাটাবেজ থেকে একটিভ বিজ্ঞাপন আনা
    const { data: ads, error } = await supabase
      .from('sponsored_ads')
      .select('*')
      .eq('is_active', true);

    if (error || !ads || ads.length === 0) return [];

    // ইউজারের পছন্দের ক্যাটাগরি অনুযায়ী ফিল্টার বা সাজানো
    return ads.sort((a, b) => {
      const matchA = a.target_category === topCategory ? 10 : 1;
      const matchB = b.target_category === topCategory ? 10 : 1;
      return matchB - matchA;
    });
  } catch (err) {
    return [];
  }
}

/**
 * ২. ফিডের পোস্টগুলোর মাঝে প্রতি ৫টি পোস্ট পর পর বিজ্ঞাপন যুক্ত করা
 * @param {Array} posts - সাধারণ পোস্ট তালিকা
 * @param {Array} ads - স্পন্সরড বিজ্ঞাপন তালিকা
 */
export function injectAdsIntoFeed(posts = [], ads = []) {
  if (!ENABLE_SPONSORED_ADS || !ads || ads.length === 0) {
    return posts; // বিজ্ঞাপন বন্ধ থাকলে সাধারণ পোস্টই রিটার্ন হবে
  }

  const feedWithAds = [];
  let adIndex = 0;

  posts.forEach((post, index) => {
    feedWithAds.push(post);

    // প্রতি ৪ বা ৫টি পোস্ট পর একটি স্পন্সরড অ্যাড ইনজেক্ট করা
    if ((index + 1) % 4 === 0 && adIndex < ads.length) {
      feedWithAds.push({
        ...ads[adIndex],
        isSponsoredAd: true // চেনার জন্য বিশেষ ফ্ল্যাগ
      });
      adIndex = (adIndex + 1) % ads.length;
    }
  });

  return feedWithAds;
}

/**
 * ৩. বিজ্ঞাপনে ভিউ বা ক্লিকের অ্যানালিটিক্স ট্র্যাক করা
 */
export async function trackAdClick(adId) {
  if (!adId) return;
  try {
    await supabase.rpc('increment_ad_click', { ad_id: adId });
  } catch (e) {
    console.error("Ad click tracking error:", e);
  }
}