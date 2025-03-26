export default class WellnessPrompts {
  constructor() {
    this.prompts = {
      stretch: [
        "Stretch your arms overhead, reaching for the ceiling",
        "Roll your shoulders backward and forward",
        "Gently rotate your neck in clockwise and counterclockwise directions",
        "Stretch your wrists by extending your arms and gently bending your hands up and down",
        "Stand up and do a gentle side stretch, reaching one arm over your head"
      ],
      
      eyes: [
        "Look away from your screen and focus on an object at least 20 feet away for 20 seconds",
        "Rub your palms together to create warmth, then gently cup your eyes without pressing",
        "Blink rapidly for 10-15 seconds to refresh your eyes",
        "Close your eyes tightly for 5 seconds, then open them wide for 5 seconds",
        "Roll your eyes in a circular motion, both clockwise and counterclockwise"
      ],
      
      breathing: [
        "Take 5 deep breaths, inhaling through your nose and exhaling through your mouth",
        "Try 4-7-8 breathing: Inhale for 4 seconds, hold for 7, exhale for 8",
        "Place one hand on your belly and breathe deeply, feeling your abdomen expand and contract",
        "Focus on your breathing for one minute, noticing the sensation of air entering and leaving your body",
        "Take a few minutes to practice mindful breathing, being fully present in the moment"
      ],
      
      hydration: [
        "Take a moment to have a glass of water",
        "Refill your water bottle to stay hydrated for the next work session",
        "Have a sip of water or herbal tea during your break",
        "Remember to hydrate throughout your day, not just during breaks",
        "Drinking enough water improves focus and energy levels"
      ],
      
      posture: [
        "Check your posture: feet flat on floor, back straight, shoulders relaxed",
        "Adjust your chair and screen height for optimal ergonomic position",
        "Stand up and align your posture: imagine a string pulling from the top of your head",
        "Make sure your eyes are level with the top of your monitor",
        "Pull your shoulders back and down to release tension in your upper back"
      ]
    };
  }
  
  // Get a random prompt from a specific category
  getRandomPrompt(category) {
    if (!this.prompts[category]) {
      return this.getRandomPromptAny();
    }
    
    const categoryPrompts = this.prompts[category];
    const randomIndex = Math.floor(Math.random() * categoryPrompts.length);
    return {
      text: categoryPrompts[randomIndex],
      category: category
    };
  }
  
  // Get a random prompt from any category
  getRandomPromptAny() {
    const categories = Object.keys(this.prompts);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    return this.getRandomPrompt(randomCategory);
  }
  
  // Get a list of all available categories
  getCategories() {
    return Object.keys(this.prompts);
  }
}