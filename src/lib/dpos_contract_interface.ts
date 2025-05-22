export const DPOS_ABI = [
  "function delegate(address validator) external payable",
  "function undelegate(address validator, uint256 amount) external",
  "function redelegate(address from, address to, uint256 amount) external",
  "function claimRewards(address validator) external",
  "function confirmUndelegate(address validator) external",
  "function getValidator(address validator) external view returns (uint256 totalStake, uint256 commission, uint256 lastCommissionUpdate, uint256 lastRewardUpdate)"
]; 