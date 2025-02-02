const EXAMPLE_QUESTIONS = [
  "What do you know about Flagstone?",
  "What is the minimum deposit for an individual account?",
  "How does FSCS protection work with multiple accounts?",
  "What types of accounts does Flagstone offer?",
  "How does the holding account work?",
  "What are the security features of the platform?",
  "Can I open a business account?",
  "How do notice accounts work?",
  "What happens to my money if Flagstone goes bankrupt?",
  "How are client funds protected?",
  "What are the benefits of having multiple savings accounts?",
];

const ExampleQuestions = ({ onQuestionClick, selectedQuestion, isLoading }) => {
  const handleClick = (question) => {
    // Always send the question when clicked
    onQuestionClick(question, false);
  };

  return (
    <div className="w-72 bg-gradient-to-br from-slate-800 to-slate-900/90 p-6 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-6 text-white border-b border-slate-600/50 pb-3">
        Frequently Asked Questions
      </h3>
      <div className="space-y-3">
        {EXAMPLE_QUESTIONS.map((question, index) => {
          const isSelected = selectedQuestion === question;

          return (
            <button
              key={index}
              onClick={() => handleClick(question)}
              disabled={isLoading && !isSelected}
              title={
                isSelected
                  ? isLoading
                    ? "Question in progress..."
                    : "Click to unselect"
                  : "Click to ask this question"
              }
              className={`w-full text-left p-3 text-sm rounded-lg
                transition-all duration-300 ease-in-out
                transform hover:scale-[1.02]
                relative group
                ${
                  isSelected
                    ? `
                    font-medium
                    text-white
                    bg-gradient-to-r from-blue-600 to-blue-700
                    shadow-lg shadow-blue-500/30
                    hover:from-blue-700 hover:to-blue-800
                    `
                    : isLoading && !isSelected
                    ? "opacity-50 cursor-not-allowed text-slate-300 bg-slate-700/30"
                    : "text-slate-300 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 hover:shadow-lg hover:shadow-slate-700/20"
                }`}
            >
              {isSelected && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuestionClick(null, true);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5
                    bg-red-500 hover:bg-red-600
                    text-white rounded-full
                    flex items-center justify-center
                    text-xs font-bold
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    cursor-pointer
                    shadow-lg
                    hover:scale-110
                    z-10"
                >
                  ×
                </span>
              )}
              {question}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExampleQuestions;
