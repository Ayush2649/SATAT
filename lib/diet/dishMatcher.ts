/**
 * SATAT (सतत्) — Smart Culinary Dish-to-Photo Auto-Matcher & Category Inference
 */

export function resolveDishThumbnail(mealName?: string, existingPhotoUrl?: string): string {
  if (existingPhotoUrl && existingPhotoUrl.trim()) {
    return existingPhotoUrl.trim();
  }

  const name = (mealName || "").toLowerCase();

  // 1. Oats / Porridge / Muesli / Almond / Cereal
  if (/oat|porridge|muesli|cereal|almond/i.test(name)) {
    return "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=300&q=75";
  }

  // 2. Corn / Bhutta / Sweet corn
  if (/corn|bhutta|maize/i.test(name)) {
    return "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=300&q=75";
  }

  // 3. Dosa / Masala Dosa / Idli / Uttapam / Sambar
  if (/dosa|idli|uttapam|sambar/i.test(name)) {
    return "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=300&q=75";
  }

  // 4. Soya / Soyabean / Soya Chunks / Edamame / Nutrela
  if (/soya|soyabean|edamame|nutrela/i.test(name)) {
    return "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=300&q=75";
  }

  // 5. Paneer / Tofu / Palak / Sabzi / Roti / Chapati / Naan / Phulka (Checked before general bhurji)
  if (/paneer|tofu|palak|sabzi|roti|chapati|naan|phulka/i.test(name)) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=300&q=75";
  }

  // 5. Cheela / Chilla / Besan / Paratha / Poha / Upma
  if (/cheela|chilla|besan|paratha|poha|upma/i.test(name)) {
    return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=300&q=75";
  }

  // 6. Dal / Chawal / Rice / Rajma / Chole / Khichdi / Curry / Biryani
  if (/dal|chawal|rajma|chole|khichdi|rice|biryani|curry|thali/i.test(name)) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=75";
  }

  // 7. Chicken / Tikka / Grill / Meat / Fish / Mutton / Kebab
  if (/chicken|tikka|grill|fish|meat|mutton|kebab|salmon/i.test(name)) {
    return "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=300&q=75";
  }

  // 8. Egg / Omelette / Bhurji / Toast / Avocado
  if (/egg|omelette|bhurji|toast|avocado/i.test(name)) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=300&q=75";
  }

  // 9. Whey / Shake / Smoothie / Protein / Lassi / Milk / Coffee
  if (/whey|shake|smoothie|protein|lassi|milk|coffee|latte|matcha/i.test(name)) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=300&q=75";
  }

  // 10. Curd / Yogurt / Dahi / Raita
  if (/curd|yogurt|dahi|raita|greek yogurt/i.test(name)) {
    return "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=75";
  }

  // Wholesome fallback plate
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75";
}

export function formatMealTimeAndCategory(createdAt?: number | string): {
  timeLabel: string;
  categoryLabel: string;
} {
  const d = createdAt ? new Date(createdAt) : new Date();
  const hours = isNaN(d.getTime()) ? new Date().getHours() : d.getHours();
  const minutes = isNaN(d.getTime()) ? new Date().getMinutes() : d.getMinutes();

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const timeLabel = `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;

  let categoryLabel = "FUEL";
  if (hours >= 5 && hours < 11) {
    categoryLabel = "BREAKFAST";
  } else if (hours >= 11 && hours < 16) {
    categoryLabel = "LUNCH";
  } else if (hours >= 16 && hours < 19) {
    categoryLabel = "EVENING FUEL";
  } else if (hours >= 19 && hours < 23) {
    categoryLabel = "DINNER";
  } else {
    categoryLabel = "NIGHT RESTORATION";
  }

  return { timeLabel, categoryLabel };
}
