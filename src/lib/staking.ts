import { ethers } from 'ethers';

const DPOS_CONTRACT_ADDRESS = '0x00000000000000000000000000000000000000fe';
const MIN_DELEGATION_AMOUNT = ethers.parseEther("1000"); // 1000 TARA minimum
const DPOS_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_validator",
        "type": "address"
      }
    ],
    "name": "delegate",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_validator",
        "type": "address"
      },
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "undelegate",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_validator",
        "type": "address"
      }
    ],
    "name": "confirmUndelegate",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_validator",
        "type": "address"
      }
    ],
    "name": "cancelUndelegate",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_validator",
        "type": "address"
      }
    ],
    "name": "getValidator",
    "outputs": [
      {
        "components": [
          {
            "name": "total_stake",
            "type": "uint256"
          },
          {
            "name": "commission_reward",
            "type": "uint256"
          },
          {
            "name": "commission",
            "type": "uint16"
          },
          {
            "name": "last_commission_change",
            "type": "uint64"
          },
          {
            "name": "undelegations_count",
            "type": "uint16"
          },
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "endpoint",
            "type": "string"
          }
        ],
        "name": "validator_info",
        "type": "tuple"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_delegator",
        "type": "address"
      },
      {
        "name": "_batch",
        "type": "uint32"
      }
    ],
    "name": "getDelegations",
    "outputs": [
      {
        "components": [
          {
            "name": "account",
            "type": "address"
          },
          {
            "components": [
              {
                "name": "stake",
                "type": "uint256"
              },
              {
                "name": "rewards",
                "type": "uint256"
              }
            ],
            "name": "delegation",
            "type": "tuple"
          }
        ],
        "name": "delegations",
        "type": "tuple[]"
      },
      {
        "name": "end",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_validator",
        "type": "address"
      }
    ],
    "name": "claimRewards",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_fromValidator",
        "type": "address"
      },
      {
        "name": "_toValidator",
        "type": "address"
      },
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "reDelegate",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_delegator",
        "type": "address"
      },
      {
        "name": "_batch",
        "type": "uint32"
      }
    ],
    "name": "getUndelegations",
    "outputs": [
      {
        "components": [
          {
            "name": "stake",
            "type": "uint256"
          },
          {
            "name": "block",
            "type": "uint64"
          },
          {
            "name": "validator",
            "type": "address"
          },
          {
            "name": "validator_exists",
            "type": "bool"
          }
        ],
        "name": "undelegations",
        "type": "tuple[]"
      },
      {
        "name": "end",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

export const TARAXA_CHAIN_ID = 841; // Taraxa Mainnet

// Define error types
interface ContractError extends Error {
  data?: string;
  code?: string;
}

export async function isValidatorRegistered(validatorAddress: string, provider: ethers.Provider) {
  try {
    const contract = new ethers.Contract(DPOS_CONTRACT_ADDRESS, DPOS_ABI, provider);
    const validatorInfo = await contract.getValidator(validatorAddress);
    console.log("Validator data:", validatorInfo);
    return validatorInfo.owner !== ethers.ZeroAddress;
  } catch (error) {
    console.error("Error checking validator:", error);
    return false;
  }
}

export async function delegateToFomogod(
  validatorAddress: string,
  amount: string,
  signer: ethers.Signer
) {
  try {
    if (!signer) {
      throw new Error("No signer provided");
    }

    // Get network info
    const network = await signer.provider?.getNetwork();
    console.log("Current network:", network);

    // Get signer address
    const signerAddress = await signer.getAddress();
    console.log("Signer address:", signerAddress);

    // Get signer balance
    const balance = await signer.provider?.getBalance(signerAddress);
    console.log("Signer balance:", ethers.formatEther(balance || 0), "TARA");

    // Check if validator is registered
    if (!signer.provider) {
      throw new Error("No provider available");
    }
    const isRegistered = await isValidatorRegistered(validatorAddress, signer.provider);
    if (!isRegistered) {
      throw new Error("Validator is not registered");
    }

    // Convert amount to wei (18 decimals)
    const amountInWei = ethers.parseEther(amount);

    // Check minimum delegation amount
    if (amountInWei < MIN_DELEGATION_AMOUNT) {
      throw new Error(`Minimum delegation amount is 1000 TARA. You tried to delegate ${amount} TARA`);
    }

    console.log("Delegating with params:", {
      validatorAddress,
      amountInWei: amountInWei.toString(),
      contractAddress: DPOS_CONTRACT_ADDRESS,
      network: network?.name,
      chainId: network?.chainId.toString()
    });

    // Create contract instance
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      signer
    );

    // Get the function data
    const delegateData = dposContract.interface.encodeFunctionData("delegate", [validatorAddress]);
    console.log("Delegate function data:", delegateData);

    // Send the transaction
    const tx = await signer.sendTransaction({
      to: DPOS_CONTRACT_ADDRESS,
      data: delegateData,
      value: amountInWei,
      gasLimit: 500000
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction mined:", receipt);

    return true;
  } catch (error) {
    console.error("Error delegating:", error);
    if (error instanceof Error) {
      // Add more detailed error information
      const errorMessage = error.message;
      const errorData = (error as any).data;
      const errorCode = (error as any).code;
      console.error("Detailed error info:", {
        message: errorMessage,
        data: errorData,
        code: errorCode
      });
      throw new Error(`Delegation failed: ${errorMessage}`);
    }
    throw error;
  }
}

export async function getUndelegationStatus(
  signer: ethers.Signer,
  validatorAddress: string
) {
  try {
    if (!signer.provider) {
      throw new Error("No provider available");
    }

    const userAddress = await signer.getAddress();
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      signer.provider
    );

    // Get current block number
    const currentBlock = await signer.provider.getBlockNumber();

    // Get undelegations for the user
    const [undelegations] = await dposContract.getUndelegations(userAddress, 0);
    console.log("Undelegations:", undelegations);

    // Find undelegation for this specific validator
    const undelegation = undelegations.find((u: { validator: string }) => 
      u.validator.toLowerCase() === validatorAddress.toLowerCase()
    );

    if (!undelegation) {
      return {
        hasUndelegation: false,
        amount: "0",
        unlockBlock: 0,
        currentBlock,
        blocksRemaining: 0,
        canConfirm: false,
        estimatedUnlockTime: null
      };
    }

    const unlockBlock = Number(undelegation.block);
    const blocksRemaining = unlockBlock - currentBlock;
    const canConfirm = blocksRemaining <= 0;

    // Estimate unlock time (assuming 2 seconds per block)
    const estimatedUnlockTime = canConfirm 
      ? new Date() 
      : new Date(Date.now() + (blocksRemaining * 2 * 1000));

    return {
      hasUndelegation: true,
      amount: ethers.formatEther(undelegation.stake),
      unlockBlock,
      currentBlock,
      blocksRemaining,
      canConfirm,
      estimatedUnlockTime
    };
  } catch (error) {
    console.error("Error getting undelegation status:", error);
    throw error;
  }
}

export async function undelegateFromFomogod(
  validatorAddress: string,
  amount: string,
  signer: ethers.Signer
) {
  try {
    if (!signer.provider) {
      throw new Error("No provider available");
    }

    // Check if there's already an undelegation in progress
    const status = await getUndelegationStatus(
      signer,
      validatorAddress
    );

    if (status.hasUndelegation) {
      throw new Error(
        `You already have an undelegation in progress. ${
          status.canConfirm
            ? "You can now confirm your undelegation."
            : `You need to wait ${status.blocksRemaining} blocks (approximately ${
                Math.ceil(status.blocksRemaining * 2 / 3600)
              } hours) before confirming.`
        }`
      );
    }

    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      signer
    );

    // Convert amount to wei (18 decimals)
    const amountInWei = ethers.parseEther(amount);

    // Get the function data
    const unDelegateData = dposContract.interface.encodeFunctionData("undelegate", [validatorAddress, amountInWei]);
    console.log("UnDelegate function data:", unDelegateData);

    // Send the transaction
    const tx = await signer.sendTransaction({
      to: DPOS_CONTRACT_ADDRESS,
      data: unDelegateData,
      gasLimit: 500000
    });

    console.log("Undelegate transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Undelegate transaction mined:", receipt);

    // Get updated status after undelegation
    const newStatus = await getUndelegationStatus(
      signer,
      validatorAddress
    );

    return {
      success: true,
      message: `Undelegation initiated. You will need to wait ${
        newStatus.blocksRemaining
      } blocks (approximately ${
        Math.ceil(newStatus.blocksRemaining * 2 / 3600)
      } hours) before confirming.`,
      txHash: tx.hash,
      status: newStatus
    };
  } catch (error) {
    console.error("Error undelegating:", error);
    if (error instanceof Error) {
      const contractError = error as ContractError;
      console.error("Detailed error info:", {
        message: error.message,
        data: contractError.data,
        code: contractError.code
      });
      throw new Error(`Undelegation failed: ${error.message}`);
    }
    throw error;
  }
}

export async function confirmUndelegate(
  validatorAddress: string,
  signer: ethers.Signer
) {
  try {
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      signer
    );

    // Get the function data
    const confirmData = dposContract.interface.encodeFunctionData("confirmUndelegate", [validatorAddress]);
    console.log("Confirm undelegate function data:", confirmData);

    // Send the transaction
    const tx = await signer.sendTransaction({
      to: DPOS_CONTRACT_ADDRESS,
      data: confirmData,
      gasLimit: 500000
    });

    console.log("Confirm undelegate transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Confirm undelegate transaction mined:", receipt);

    return {
      success: true,
      message: "Undelegation confirmed. Your tokens have been returned to your wallet.",
      txHash: tx.hash
    };
  } catch (error) {
    console.error("Error confirming undelegation:", error);
    if (error instanceof Error) {
      // Add more detailed error information
      const errorMessage = error.message;
      const errorData = (error as any).data;
      const errorCode = (error as any).code;
      console.error("Detailed error info:", {
        message: errorMessage,
        data: errorData,
        code: errorCode
      });
      throw new Error(`Confirm undelegation failed: ${errorMessage}`);
    }
    throw error;
  }
}

export async function claimRewards(
  validatorAddress: string,
  signer: ethers.Signer
) {
  try {
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      signer
    );

    // Call the claimRewards function
    const tx = await dposContract.claimRewards(validatorAddress);

    // Wait for transaction to be mined
    await tx.wait();

    return true;
  } catch (error) {
    console.error("Error claiming rewards:", error);
    throw error;
  }
}

export async function getValidatorInfo(
  validatorAddress: string,
  provider: ethers.Provider
) {
  try {
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      provider
    );

    // Call the getValidator function
    const validatorInfo = await dposContract.getValidator(validatorAddress);

    return {
      totalStake: ethers.formatEther(validatorInfo.validator_info.total_stake),
      commission: validatorInfo.validator_info.commission.toString(),
      lastCommissionUpdate: new Date(
        Number(validatorInfo.validator_info.last_commission_change) * 1000
      ).toLocaleString(),
      lastRewardUpdate: new Date(
        Number(validatorInfo.validator_info.commission_reward) * 1000
      ).toLocaleString(),
    };
  } catch (error) {
    console.error("Error getting validator info:", error);
    throw error;
  }
}

export async function getDelegationInfo(
  delegatorAddress: string,
  validatorAddress: string,
  provider: ethers.Provider
) {
  try {
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      provider
    );

    // Get current delegation amount
    const [delegations] = await dposContract.getDelegations(delegatorAddress, 0);
    const delegation = delegations.find((d: { account: string }) => 
      d.account.toLowerCase() === validatorAddress.toLowerCase()
    );

    // Get undelegation status if any
    const [undelegations] = await dposContract.getUndelegations(delegatorAddress, 0);
    const undelegation = undelegations.find((u: { validator: string }) => 
      u.validator.toLowerCase() === validatorAddress.toLowerCase()
    );

    // Get validator info
    const validatorInfo = await dposContract.getValidator(validatorAddress);

    return {
      delegationAmount: delegation ? ethers.formatEther(delegation.delegation.stake) : "0",
      undelegationStatus: undelegation ? {
        hasUndelegation: true,
        amount: ethers.formatEther(undelegation.stake),
        unlockBlock: Number(undelegation.block),
        currentBlock: await provider.getBlockNumber(),
        blocksRemaining: Number(undelegation.block) - await provider.getBlockNumber(),
        canConfirm: Number(undelegation.block) <= await provider.getBlockNumber(),
        estimatedUnlockTime: new Date(Date.now() + ((Number(undelegation.block) - await provider.getBlockNumber()) * 2 * 1000))
      } : {
        hasUndelegation: false,
        amount: "0",
        unlockBlock: 0,
        currentBlock: await provider.getBlockNumber(),
        blocksRemaining: 0,
        canConfirm: false,
        estimatedUnlockTime: null
      },
      validatorInfo: {
        totalDelegation: ethers.formatEther(validatorInfo.total_stake),
        commission: validatorInfo.commission.toString(),
        registered: true
      }
    };
  } catch (error) {
    console.error("Error getting delegation info:", error);
    throw error;
  }
}

export async function getUserStakeAmount(
  signer: ethers.Signer,
  validatorAddress: string
) {
  try {
    if (!signer.provider) {
      throw new Error("No provider available");
    }

    const userAddress = await signer.getAddress();
    const delegationInfo = await getDelegationInfo(userAddress, validatorAddress, signer.provider);
    
    console.log("Stake info:", {
      userAddress,
      validatorAddress,
      ...delegationInfo
    });

    return {
      stakedAmount: delegationInfo.delegationAmount,
      stakedAmountWei: ethers.parseEther(delegationInfo.delegationAmount).toString(),
      validatorInfo: delegationInfo.validatorInfo,
      undelegationStatus: delegationInfo.undelegationStatus
    };
  } catch (error) {
    console.error("Error getting user stake amount:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get stake amount: ${error.message}`);
    }
    throw error;
  }
}

export async function cancelUndelegate(
  validatorAddress: string,
  signer: ethers.Signer
) {
  try {
    const dposContract = new ethers.Contract(
      DPOS_CONTRACT_ADDRESS,
      DPOS_ABI,
      signer
    );

    // Call the cancelUndelegate function directly
    const tx = await dposContract.cancelUndelegate(validatorAddress);
    console.log("Cancel undelegate transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Cancel undelegate transaction mined:", receipt);

    return {
      success: true,
      message: "Undelegation cancelled successfully. Your tokens remain staked.",
      txHash: tx.hash
    };
  } catch (error) {
    console.error("Error canceling undelegation:", error);
    if (error instanceof Error) {
      // Add more detailed error information
      const errorMessage = error.message;
      const errorData = (error as any).data;
      const errorCode = (error as any).code;
      console.error("Detailed error info:", {
        message: errorMessage,
        data: errorData,
        code: errorCode
      });
      throw new Error(`Cancel undelegation failed: ${errorMessage}`);
    }
    throw error;
  }
}
