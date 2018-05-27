pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract BitcoffeeCoin is StandardToken {

    string public constant name = "BitcoffeeCoin";
    string public constant symbol = "BCOF";
    uint8  public constant decimals = 3;
    uint   public constant INITIAL_SUPPLY = 13000000 * (10 ** uint256(decimals));

    constructor() public {
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }
}
