export const MOCK_PROBLEM = {
  title: "1. Two Sum",
  difficulty: "Easy",
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.
  
You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]"
    }
  ],
  constraints: [
    "2 <= nums.length <= 104",
    "-109 <= nums[i] <= 109",
    "-109 <= target <= 109",
    "Only one valid answer exists."
  ]
};

export const MOCK_SESSIONS = [
  { id: "SESS-9021", candidate: "Alex Johnson", status: "Completed", riskScore: 12, date: "2024-04-15" },
  { id: "SESS-9022", candidate: "Sarah Chen", status: "In Progress", riskScore: 68, date: "2024-04-16" },
  { id: "SESS-9023", candidate: "Marcus Miller", status: "Flagged", riskScore: 89, date: "2024-04-16" },
  { id: "SESS-9024", candidate: "Elena Rodriguez", status: "Completed", riskScore: 5, date: "2024-04-14" },
  { id: "SESS-9025", candidate: "David Kim", status: "Pending Review", riskScore: 45, date: "2024-04-15" },
];

export const MOCK_ALERTS = [
  { id: 1, type: "Eye Tracking", message: "Candidate looking away for 5s", severity: "High", time: "10:24:12 AM" },
  { id: 2, type: "Tab Switch", message: "Browser tab switched to 'Search'", severity: "Critical", time: "10:26:05 AM" },
  { id: 3, type: "Audio", message: "Background conversation detected", severity: "Medium", time: "10:28:45 AM" },
  { id: 4, type: "Face Detection", message: "Multiple faces detected in frame", severity: "Critical", time: "10:30:12 AM" },
];
