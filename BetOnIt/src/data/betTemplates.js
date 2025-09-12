export const betTemplates = {
  'Game Night': [
    {
      question: "Who will win the first game?",
      type: "multiple_choice",
      options: ["Player 1", "Player 2", "Player 3", "Player 4"]
    },
    {
      question: "What will be the final score difference?",
      type: "multiple_choice",
      options: ["1-5 points", "6-10 points", "11-15 points", "16+ points"]
    },
    {
      question: "Who will be eliminated first?",
      type: "multiple_choice",
      options: ["Player 1", "Player 2", "Player 3", "Player 4"]
    },
    {
      question: "How long will the longest game last?",
      type: "multiple_choice",
      options: ["Under 30 min", "30-60 min", "1-2 hours", "Over 2 hours"]
    }
  ],
  'Sports Viewing': [
    {
      question: "Who will win the game?",
      type: "multiple_choice",
      options: ["Home Team", "Away Team", "Tie"]
    },
    {
      question: "What will be the total score?",
      type: "multiple_choice",
      options: ["Under 40", "40-60", "61-80", "Over 80"]
    },
    {
      question: "Who will score first?",
      type: "multiple_choice",
      options: ["Home Team", "Away Team"]
    },
    {
      question: "Will there be overtime?",
      type: "multiple_choice",
      options: ["Yes", "No"]
    }
  ],
  'Party': [
    {
      question: "Who will arrive last?",
      type: "multiple_choice",
      options: ["Guest 1", "Guest 2", "Guest 3", "Guest 4"]
    },
    {
      question: "What time will the party really get started?",
      type: "multiple_choice",
      options: ["Before 8 PM", "8-9 PM", "9-10 PM", "After 10 PM"]
    },
    {
      question: "Who will be the life of the party?",
      type: "multiple_choice",
      options: ["Guest 1", "Guest 2", "Guest 3", "Guest 4"]
    },
    {
      question: "How many people will show up?",
      type: "multiple_choice",
      options: ["Under 10", "10-20", "21-30", "Over 30"]
    }
  ],
  'General': [
    {
      question: "What will the weather be like?",
      type: "multiple_choice",
      options: ["Sunny", "Cloudy", "Rainy", "Stormy"]
    },
    {
      question: "Who will have the most fun?",
      type: "multiple_choice",
      options: ["Person 1", "Person 2", "Person 3", "Everyone equally"]
    },
    {
      question: "What time will this end?",
      type: "multiple_choice",
      options: ["Before 9 PM", "9-11 PM", "11 PM-1 AM", "After 1 AM"]
    }
  ]
};

export const getBetTemplatesByCategory = (category) => {
  return betTemplates[category] || betTemplates['General'];
};

export const getAllCategories = () => {
  return Object.keys(betTemplates);
};