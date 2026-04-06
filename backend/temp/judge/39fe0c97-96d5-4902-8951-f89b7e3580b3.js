
// ==================== USER CODE START ====================
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let currentSum = nums[0];
    let maxSum = nums[0];

    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
};

// ==================== USER CODE END ====================

// ==================== JUDGE WRAPPER ====================
(function() {
  try {
    // Call user's function with test case inputs
    const result = maxSubArray([-1,-2,-3,-4]);
    
    // Print the return value as JSON for comparison
    console.log(JSON.stringify(result));
  } catch (error) {
    // Print error for debugging
    console.error('RUNTIME_ERROR:', error.message);
    process.exit(1);
  }
})();
