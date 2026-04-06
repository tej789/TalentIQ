import mongoose from "mongoose";
import dotenv from "dotenv";
import Problem from "./models/Problem.js";
import User from "./models/User.js";

dotenv.config();

const sampleProblems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    difficulty: "Easy",
    category: "Arrays",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "" },
      { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "" },
    ],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true },
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  
  return [];
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6)); // Expected: [1, 2]
console.log(twoSum([3, 3], 6)); // Expected: [0, 1]`,
      python: `def twoSum(nums, target):
    # Write your solution here
    
    return []

# Test cases
print(twoSum([2, 7, 11, 15], 9))  # Expected: [0, 1]
print(twoSum([3, 2, 4], 6))  # Expected: [1, 2]
print(twoSum([3, 3], 6))  # Expected: [0, 1]`,
      java: `import java.util.*;

class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
        return new int[0];
    }
    
    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9))); // Expected: [0, 1]
        System.out.println(Arrays.toString(twoSum(new int[]{3, 2, 4}, 6))); // Expected: [1, 2]
        System.out.println(Arrays.toString(twoSum(new int[]{3, 3}, 6))); // Expected: [0, 1]
    }
}`,
    },
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    description: "Write a function that reverses a string. The input string is given as an array of characters.",
    difficulty: "Easy",
    category: "Strings",
    constraints: ["1 <= s.length <= 10^5", "s[i] is a printable ASCII character"],
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "" },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: "" },
    ],
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false },
    ],
    starterCode: {
      javascript: `function reverseString(s) {
  // Write your solution here
  
}

// Test cases
let test1 = ["h","e","l","l","o"];
reverseString(test1);
console.log(test1); // Expected: ["o","l","l","e","h"]

let test2 = ["H","a","n","n","a","h"];
reverseString(test2);
console.log(test2); // Expected: ["h","a","n","n","a","H"]`,
      python: `def reverseString(s):
    # Write your solution here
    pass

# Test cases
test1 = ["h","e","l","l","o"]
reverseString(test1)
print(test1)  # Expected: ["o","l","l","e","h"]

test2 = ["H","a","n","n","a","h"]
reverseString(test2)
print(test2)  # Expected: ["h","a","n","n","a","H"]`,
      java: `import java.util.*;

class Solution {
    public static void reverseString(char[] s) {
        // Write your solution here
        
    }
    
    public static void main(String[] args) {
        char[] test1 = {'h','e','l','l','o'};
        reverseString(test1);
        System.out.println(Arrays.toString(test1)); // Expected: [o, l, l, e, h]
        
        char[] test2 = {'H','a','n','n','a','h'};
        reverseString(test2);
        System.out.println(Arrays.toString(test2)); // Expected: [h, a, n, n, a, H]
    }
}`,
    },
  },
  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    difficulty: "Easy",
    category: "Strings",
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters"],
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: "'amanaplanacanalpanama' is a palindrome." },
      { input: 's = "race a car"', output: "false", explanation: "'raceacar' is not a palindrome." },
      { input: 's = " "', output: "true", explanation: "Empty string after removing non-alphanumeric characters is a palindrome." },
    ],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false },
      { input: '"race a car"', expectedOutput: "false", isHidden: false },
      { input: '" "', expectedOutput: "true", isHidden: true },
    ],
    starterCode: {
      javascript: `function isPalindrome(s) {
  // Write your solution here
  
  return false;
}

// Test cases
console.log(isPalindrome("A man, a plan, a canal: Panama")); // Expected: true
console.log(isPalindrome("race a car")); // Expected: false
console.log(isPalindrome(" ")); // Expected: true`,
      python: `def isPalindrome(s):
    # Write your solution here
    
    return False

# Test cases
print(isPalindrome("A man, a plan, a canal: Panama"))  # Expected: True
print(isPalindrome("race a car"))  # Expected: False
print(isPalindrome(" "))  # Expected: True`,
      java: `class Solution {
    public static boolean isPalindrome(String s) {
        // Write your solution here
        
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isPalindrome("A man, a plan, a canal: Panama")); // Expected: true
        System.out.println(isPalindrome("race a car")); // Expected: false
        System.out.println(isPalindrome(" ")); // Expected: true
    }
}`,
    },
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray-sum",
    description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum, and return its sum.",
    difficulty: "Medium",
    category: "Algorithms",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1", explanation: "The subarray [1] has the largest sum 1." },
      { input: "nums = [5,4,-1,7,8]", output: "23", explanation: "The subarray [5,4,-1,7,8] has the largest sum 23." },
    ],
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
      { input: "[1]", expectedOutput: "1", isHidden: false },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", isHidden: true },
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {
  // Write your solution here
  
  return 0;
}

// Test cases
console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4])); // Expected: 6
console.log(maxSubArray([1])); // Expected: 1
console.log(maxSubArray([5,4,-1,7,8])); // Expected: 23`,
      python: `def maxSubArray(nums):
    # Write your solution here
    
    return 0

# Test cases
print(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))  # Expected: 6
print(maxSubArray([1]))  # Expected: 1
print(maxSubArray([5,4,-1,7,8]))  # Expected: 23`,
      java: `class Solution {
    public static int maxSubArray(int[] nums) {
        // Write your solution here
        
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})); // Expected: 6
        System.out.println(maxSubArray(new int[]{1})); // Expected: 1
        System.out.println(maxSubArray(new int[]{5,4,-1,7,8})); // Expected: 23
    }
}`,
    },
  },
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    difficulty: "Medium",
    category: "Arrays",
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The max area of water the container can contain is 49." },
      { input: "height = [1,1]", output: "1", explanation: "" },
    ],
    testCases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false },
      { input: "[1,1]", expectedOutput: "1", isHidden: false },
    ],
    starterCode: {
      javascript: `function maxArea(height) {
  // Write your solution here
  
  return 0;
}

// Test cases
console.log(maxArea([1,8,6,2,5,4,8,3,7])); // Expected: 49
console.log(maxArea([1,1])); // Expected: 1`,
      python: `def maxArea(height):
    # Write your solution here
    
    return 0

# Test cases
print(maxArea([1,8,6,2,5,4,8,3,7]))  # Expected: 49
print(maxArea([1,1]))  # Expected: 1`,
      java: `class Solution {
    public static int maxArea(int[] height) {
        // Write your solution here
        
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(maxArea(new int[]{1,8,6,2,5,4,8,3,7})); // Expected: 49
        System.out.println(maxArea(new int[]{1,1})); // Expected: 1
    }
}`,
    },
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB");

    // Check if we need to create a default admin user
    let adminUser = await User.findOne({ role: "admin" });
    
    if (!adminUser) {
      console.log("⚠️  No admin user found. Please create an admin user first by:");
      console.log("1. Login to your app with Clerk");
      console.log("2. Then update that user's role to 'admin' in MongoDB");
      console.log("\\nFor now, checking for any user to use as createdBy...");
      
      const anyUser = await User.findOne();
      if (!anyUser) {
        console.log("❌ No users found. Please login first, then run this seed script again.");
        process.exit(1);
      }
      adminUser = anyUser;
    }

    console.log(`📝 Using user: ${adminUser.email} as creator`);

    // Upsert problems (update existing, insert new — won't lose user submissions data)
    let created = 0;
    let updated = 0;
    for (const problemData of sampleProblems) {
      const existing = await Problem.findOne({ slug: problemData.slug });
      if (existing) {
        await Problem.updateOne({ slug: problemData.slug }, { $set: problemData });
        updated++;
      } else {
        await Problem.create({ ...problemData, createdBy: adminUser._id });
        created++;
      }
    }

    console.log(`✅ Seeded problems: ${created} created, ${updated} updated`);
    
    // Display stats
    const totalProblems = await Problem.countDocuments();
    console.log(`\\n📊 Total problems in database: ${totalProblems}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
