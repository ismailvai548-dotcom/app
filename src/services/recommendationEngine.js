import { supabase } from './supabaseClient';

const USER_PREFS_KEY = 'bookfair_user_interests_v2';
let syncTimeout = null;

const defaultPreferences = {
  categories: { 'কথামালা': 5, 'দাস্তান': 5, 'বই': 5 },
  authors: {},
  tags: {}
};

/**
 * ১. লোকাল মেমরি থেকে পয়েন্ট রিড করা
 */
export function getUserPreferences() {
  try {
    const saved = localStorage.getItem(USER_PREFS_KEY);
    return saved ? JSON.parse(saved) : defaultPreferences;
  } catch (e) {
    return defaultPreferences;
  }
}

/**
 * ২. ক্লাউড (Supabase) থেকে পয়েন্ট লোকাল মেমরিতে সিঙ্ক করা
 */
export async function syncUserPreferencesFromCloud(currentUser) {
  if (!currentUser || !currentUser.id || currentUser.id === 'guest_user_123') return;

  try {
    const { data } = await supabase
      .from('profiles')
      .select('interests')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (data && data.interests) {
      const localPrefs = getUserPreferences();
      const merged = {
        categories: { ...localPrefs.categories, ...(data.interests.categories || {}) },
        authors: { ...localPrefs.authors, ...(data.interests.authors || {}) },
        tags: { ...localPrefs.tags, ...(data.interests.tags || {}) }
      };
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify(merged));
    }
  } catch (err) {
    console.error("Cloud sync error:", err);
  }
}

/**
 * ৩. ব্যাকগ্রাউন্ডে ক্লাউডে সেভ করা (Debounced Sync)
 */
function syncToSupabaseBackground(currentUser, currentPrefs) {
  if (!currentUser || !currentUser.id || currentUser.id === 'guest_user_123') return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await supabase
        .from('profiles')
        .update({ interests: currentPrefs })
        .eq('id', currentUser.id);
    } catch (e) {
      console.error("Background sync failed:", e);
    }
  }, 3000);
}

/**
 * ৪. ব্যবহারকারীর অ্যাকশন ট্র্যাক করা
 */
export function recordInteraction({ category = null, author = null, tags = [] }, actionType = 'view', currentUser = null) {
  const weights = {
    view: 1,      // পড়লে +১
    like: 3,      // লাইক দিলে +৩
    comment: 5,   // কমেন্ট করলে +৫
    save: 7       // বুকমার্ক করলে +৭
  };

  const points = weights[actionType] || 1;
  const currentPrefs = getUserPreferences();

  if (category) {
    currentPrefs.categories[category] = (currentPrefs.categories[category] || 0) + points;
  }
  if (author) {
    currentPrefs.authors[author] = (currentPrefs.authors[author] || 0) + points;
  }
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (tag) currentPrefs.tags[tag] = (currentPrefs.tags[tag] || 0) + points;
    });
  }

  try {
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(currentPrefs));
  } catch (e) {
    console.error("Local save error", e);
  }

  syncToSupabaseBackground(currentUser, currentPrefs);
}

/**
 * ৫. পোস্টের স্কোর গণনা (Multi-Factor Scoring)
 */
export function calculatePostScore(post, userPrefs) {
  const { categories = {}, authors = {}, tags = {} } = userPrefs;

  // ক. ক্যাটাগরি পয়েন্ট
  const catScore = (categories[post.category] || 1) * 3;

  // খ. লেখক পয়েন্ট (Priority)
  const authorName = post.author_name || post.author;
  const authorScore = (authors[authorName] || 0) * 4;

  // গ. ট্যাগ পয়েন্ট
  let tagScore = 0;
  if (post.tags && Array.isArray(post.tags)) {
    post.tags.forEach(t => {
      tagScore += (tags[t] || 0) * 2;
    });
  }

  // ঘ. এনগেজমেন্ট (লাইক ও কমেন্ট)
  const likes = post.likes_count || 0;
  const comments = post.comments_count || 0;
  const engagementScore = (likes * 2 + comments * 3) * 0.4;

  // ঙ. নতুনত্ব (Freshness / Recency Boost)
  const postTime = new Date(post.created_at || Date.now()).getTime();
  const hoursAgo = Math.max(1, (Date.now() - postTime) / (1000 * 60 * 60));
  const recencyScore = Math.max(0, 45 - (hoursAgo * 1.2));

  return catScore + authorScore + tagScore + engagementScore + recencyScore;
}

/**
 * ৬. স্মার্ট ফিড মিক্সিং (একই লেখকের পোস্ট পরপর আসা বন্ধ করে বৈচিত্র্য তৈরি করা)
 */
function diversifyFeed(sortedPosts) {
  if (sortedPosts.length <= 2) return sortedPosts;

  const result = [];
  const remaining = [...sortedPosts];

  while (remaining.length > 0) {
    const lastAuthor = result.length > 0 ? (result[result.length - 1].author_name || result[result.length - 1].author) : null;
    
    // আগের পোস্টের লেখক বাদে অন্য লেখকের সেরা পোস্ট খোঁজা
    let nextIndex = remaining.findIndex(p => (p.author_name || p.author) !== lastAuthor);

    // যদি সবাই একই লেখকের হয়, তবে ১ম পোস্টটিই নেওয়া হবে
    if (nextIndex === -1) nextIndex = 0;

    result.push(remaining.splice(nextIndex, 1)[0]);
  }

  return result;
}

/**
 * ৭. সম্পূর্ণ রেকমেন্ডেশন ফিড জেনারেট করা
 */
export function getRecommendedPosts(posts = []) {
  if (!posts || posts.length === 0) return [];
  const userPrefs = getUserPreferences();

  // ক. প্রথমে সবার স্কোর হিসাব করে সর্ট করা
  const scoredPosts = [...posts].sort((a, b) => {
    const scoreA = calculatePostScore(a, userPrefs);
    const scoreB = calculatePostScore(b, userPrefs);
    return scoreB - scoreA;
  });

  // খ. তারপর স্মার্ট ফিড মিক্সিং প্রয়োগ করা
  return diversifyFeed(scoredPosts);
}