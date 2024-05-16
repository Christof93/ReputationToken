// contracts/ReputationToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "fungible-sbt/contracts/FungibleSBTDepositable.sol";

/**
 * @title Fungible Soulbound Token Implementation
 * @dev Implementation of a fungible soul-bound token.
 */
contract ReputationToken is  FungibleSBTDepositable {
    event Issue(address indexed from, address indexed to, uint256 value, string indexed about);
    event Deposit(address indexed from, address indexed to, uint256 value, string indexed about);
    event Burn(address indexed from, address indexed to, uint256 value, string indexed about);
    event Return(address indexed from, address indexed to, uint256 value, string indexed about);

    constructor(string memory name_, string memory symbol_) FungibleSBTDepositable(
        name_,
        symbol_
    ) {}
    /**
     * @notice Issue an amount of tokens to an address.
     * @dev MUST revert if the `to` address is the zero address.
     * @param to The address to issue the token to
     * @param amount The amount of tokens
     */
    function issue(
        address to,
        uint256 amount,
        string calldata about
    ) external returns (bool) {
        address from = msg.sender;
        _transfer(from, to, amount);
        // can not be more than _totalSupply
        unchecked {
            _issued[to][from] += amount;
        }
        emit Issue(from, to, amount, about);
        return true;
    }


    /**
     * @dev Sets `amount` as allowance of `revoker` to burn caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Deposit} event.
     * @param revoker address of the account burning the tokens.
     * @param amount allowance of tokens which may be burned by the revoker.
     */
    function grantCollateral(address revoker, uint256 amount, string calldata about) external returns (bool) {
        address from = msg.sender;
        uint256 accountBalance = _balances[from];
        uint256 alreadyLent = _totalCollaterals[from];
        require(alreadyLent + amount <= accountBalance,
            "Fungible SBT: Can not grant collateral. Resulting deposits exceed total balance.");
        _setBurnAllowance(from, revoker, amount);
        emit Deposit(from, revoker, amount, about);
        return true;
    }

    /**
     * @notice Return the revocation authorisations.
     * @param account The account
     * @param amount The amount of tokens
     */
    function returnDeposit(address account, uint256 amount, string calldata about) external returns (bool) {
        address revoker = msg.sender;
        uint256 allowance = _burnAllowances[account][revoker];
        
        require(allowance >= amount, "Fungible SBT: Trying to return amount larger than assigned collateral deposit.");
        if (account != revoker) {
            _spendBurnAllowance(account, revoker, amount);
        }
        emit Return(revoker, account, amount, about);
        return true;
    }

    /**
     * @notice Revoke/burn tokens.
     * @param account The account
     * @param amount The amount of tokens
     */
    function burnDeposit(address account, uint256 amount, string calldata about) external returns (bool) {
        address revoker = msg.sender;
        uint256 allowance = _burnAllowances[account][revoker];
        
        require(allowance >= amount, "Fungible SBT: Trying to burn amount larger than assigned collateral deposit.");
        _burn(account, amount);
        if (account != revoker) {
            _spendBurnAllowance(account, revoker, amount);
        }
        emit Burn(revoker, account, amount, about);
        return true;
    }
}