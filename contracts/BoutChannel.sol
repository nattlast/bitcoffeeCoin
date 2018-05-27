pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zos-lib/contracts/migrations/Migratable.sol";

contract BoutChannel is Migratable {

    uint constant VetoCost = 80000;

    address owner;
    address token;
    uint waitBlocks;

    struct Certificate {
        uint256 expiration;
        uint16  nonce;
        uint16  points;
        bool    challenged;
    }

    struct Operation {
        bytes32 certificateHash;
        uint    blockNumber;
        uint    ethValue;
    }

    event Challenged(address sender, uint16 nonce);
    event Redeemed(address sender);
    
    mapping (address => uint) nonces;

    mapping (address => Operation) pending; 

    function initialize(address _token) isInitializer("BoutChannel", "0") public {
        token = _token;
        owner = msg.sender;
        waitBlocks = 20;
    }
    // constructor() public {}
    // function init(address _token) public {
    //     token = _token;
    //     owner = msg.sender;
    //     waitBlocks = 20;
    // }

    function getNonce(address addr) public view returns (uint) {
        return nonces[addr];
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getNow() public view returns (uint) {
        return now;
    }

    function setWaitBlocks(uint n) external onlyOwner {
        waitBlocks = n;
    }

    function recover(bytes32 message, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
        return ecrecover(message, v, r, s);
    }

    function pack(uint256 expiration, uint16 nonce, uint16 points, bool challenged) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(expiration, nonce, points, challenged));
    }

    function decorate(string prefix, bytes32 suffix) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(prefix, suffix));
    }

    function encode(uint256 expiration, uint16 nonce, uint16 points, bool challenged) public pure returns (bytes32) {
        return decorate("\x19Ethereum Signed Message:\n32", pack(expiration, nonce, points, challenged));
    }

    function redeem(
        uint256 expiration,
        uint16 nonce,
        uint16 points,
        bool challenged,
        uint8 v,
        bytes32 r,
        bytes32 s)
        external payable
    {
        require(!challenged || msg.value >= tx.gasprice * VetoCost);
        require(nonces[msg.sender] < nonce && now < expiration);
        bytes32 chash = encode(expiration, nonce, points, challenged);
        address signer = ecrecover(chash, v, r, s);
        require(owner == signer);
        nonces[msg.sender] = nonce;
        if (challenged) {
            pending[msg.sender] = Operation({
                certificateHash : chash,
                blockNumber : block.number,
                ethValue : msg.value});
            emit Challenged(msg.sender, nonce);
        } else {
            ERC20(token).transfer(msg.sender, points);
            emit Redeemed(msg.sender);
        }
    }

    function refund(
        uint256 expiration,
        uint16 nonce,
        uint16 points,
        bool challenged)
        external
    {
        require(now < expiration);
        require(block.number >= pending[msg.sender].blockNumber + waitBlocks);
        bytes32 chash = encode(expiration, nonce, points, challenged);
        require(pending[msg.sender].certificateHash == chash);
        delete pending[msg.sender];
        ERC20(token).transfer(msg.sender, points);
        msg.sender.transfer(pending[msg.sender].ethValue);
    }

    function veto(
        address sender,
        uint256 expiration,
        uint16 nonce,
        uint16 points,
        bool challenged,
        uint8 v,
        bytes32 r,
        bytes32 s)
        external onlyOwner
    {
        require(nonce > nonces[sender]);
        bytes32 chash = encode(expiration, nonce, points, challenged);
        address signer = ecrecover(chash, v, r, s);
        require(sender == signer);
        nonces[sender] = nonce;
        owner.transfer(pending[sender].ethValue);
        delete pending[msg.sender];
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

}
