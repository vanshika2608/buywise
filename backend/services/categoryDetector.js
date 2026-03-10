const CATEGORIES = {
  electronics: ["phone", "mobile", "laptop", "tablet", "headphone", "earphone", "speaker", "camera", "tv", "monitor", "keyboard", "mouse", "charger", "cable", "router", "smartwatch", "wearable", "drone", "printer", "projector"],
  fashion: ["shirt", "kurta", "dress", "saree", "jeans", "trouser", "jacket", "coat", "suit", "watch", "sunglasses", "bag", "purse", "wallet", "belt", "shoes", "sneakers", "sandals", "heels", "boots"],
  drinkware: ["mug", "cup", "tumbler", "bottle", "flask", "thermos", "glass", "sipper"],
  fitness: ["yoga", "dumbbell", "barbell", "treadmill", "gym", "resistance", "protein", "supplement", "mat", "kettlebell", "band", "pullup"],
  homeappliance: ["mixer", "grinder", "blender", "juicer", "microwave", "oven", "iron", "fan", "cooler", "refrigerator", "washing", "dishwasher", "vacuum"],
  furniture: ["chair", "desk", "table", "sofa", "bed", "mattress", "shelf", "cabinet", "drawer", "rack"],
  beauty: ["cream", "serum", "moisturizer", "sunscreen", "lipstick", "mascara", "foundation", "concealer", "perfume", "shampoo", "conditioner", "face wash"],
  books: ["book", "novel", "textbook", "guide", "paperback", "hardcover", "fiction", "biography"],
  kitchen: ["pan", "pot", "cooker", "kadai", "tawa", "cookware", "knife", "cutting board", "spatula", "ladle", "container"],
  toys: ["toy", "lego", "doll", "puzzle", "board game", "action figure", "remote control"],
  stationery: ["pen", "pencil", "notebook", "diary", "planner", "highlighter", "marker", "eraser", "stapler"],
};

export function detectCategory(title) {
  if (!title) return "uncategorized";
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return "uncategorized";
}