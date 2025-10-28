// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package census

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// DavinciDaoCensusProofInput is an auto generated low-level Go binding around an user-defined struct.
type DavinciDaoCensusProofInput struct {
	Account  common.Address
	Siblings []*big.Int
}

// DavinciDaoCensusMetaData contains all meta data concerning the DavinciDaoCensus contract.
var DavinciDaoCensusMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"tokens\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"collections\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"token\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"computeLeaf\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"delegate\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"toProof\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"fromProofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDaoCensus.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getAccountAt\",\"inputs\":[{\"name\":\"index\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getCensusRoot\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getDelegations\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"weight\",\"type\":\"uint88\",\"internalType\":\"uint88\"},{\"name\":\"leaf\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getNFTids\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"candidateIds\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getTokenDelegations\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[{\"name\":\"delegates\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"indexAccount\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"tokenDelegate\",\"inputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"undelegate\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"proofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDaoCensus.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"updateDelegation\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"fromProofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDaoCensus.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]},{\"name\":\"toProof\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"weightOf\",\"inputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint88\",\"internalType\":\"uint88\"}],\"stateMutability\":\"view\"},{\"type\":\"event\",\"name\":\"CensusRootUpdated\",\"inputs\":[{\"name\":\"newRoot\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Delegated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"to\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Undelegated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"from\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"WeightChanged\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"previousWeight\",\"type\":\"uint88\",\"indexed\":false,\"internalType\":\"uint88\"},{\"name\":\"newWeight\",\"type\":\"uint88\",\"indexed\":false,\"internalType\":\"uint88\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"AlreadyDelegated\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"InvalidCollection\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"InvalidTokenId\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"LeafAlreadyExists\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafCannotBeZero\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafDoesNotExist\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafGreaterThanSnarkScalarField\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NoNewDelegations\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NotDelegated\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"NotTokenOwner\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"ProofRequired\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"WeightOverflow\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WeightUnderflow\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WrongSiblingNodes\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ZeroAddress\",\"inputs\":[]}]",
	Bin: "0x608060405234801561000f575f5ffd5b5060405161240e38038061240e83398101604081905261002e91610117565b80518061006e5760405162461bcd60e51b815260206004820152600a60248201526962616420636f6e66696760b01b604482015260640160405180910390fd5b5f5b818110156100e0575f8054600101815580528251839082908110610096576100966101e1565b60200260200101515f82815481106100b0576100b06101e1565b5f91825260209091200180546001600160a01b0319166001600160a01b0392909216919091179055600101610070565b5050506101f5565b634e487b7160e01b5f52604160045260245ffd5b80516001600160a01b0381168114610112575f5ffd5b919050565b5f60208284031215610127575f5ffd5b81516001600160401b0381111561013c575f5ffd5b8201601f8101841361014c575f5ffd5b80516001600160401b03811115610165576101656100e8565b604051600582901b90603f8201601f191681016001600160401b0381118282101715610193576101936100e8565b6040529182526020818401810192908101878411156101b0575f5ffd5b6020850194505b838510156101d6576101c8856100fc565b8152602094850194016101b7565b509695505050505050565b634e487b7160e01b5f52603260045260245ffd5b61220c806102025f395ff3fe608060405234801561000f575f5ffd5b50600436106100cb575f3560e01c8063c333b0f111610088578063dd4bc10111610063578063dd4bc101146101f8578063f157c0ac14610238578063f8fee8ed14610260578063fdbda0ec14610288575f5ffd5b8063c333b0f1146101b2578063d0424d7c146101d2578063d4d10661146101e5575f5ffd5b80631b1db502146100cf57806331cc13ba146100e457806366e12bef1461011b5780637b6c7c711461015b5780638498be041461017c578063c1da86911461019c575b5f5ffd5b6100e26100dd366004611d32565b61029b565b005b6100f76100f2366004611dbd565b610635565b604080516001600160581b0390931683526020830191909152015b60405180910390f35b610143610129366004611dd8565b60076020525f90815260409020546001600160a01b031681565b6040516001600160a01b039091168152602001610112565b61016e610169366004611dbd565b610668565b604051908152602001610112565b61018f61018a366004611def565b61069a565b6040516101129190611e36565b6002545f9081526003602052604090205461016e565b6101c56101c0366004611def565b61080d565b6040516101129190611e78565b6100e26101e0366004611eb8565b61090c565b6100e26101f3366004611eb8565b6109df565b610220610206366004611dbd565b60056020525f90815260409020546001600160581b031681565b6040516001600160581b039091168152602001610112565b610143610246366004611dd8565b5f908152600660205260409020546001600160a01b031690565b61014361026e366004611dd8565b60066020525f90815260409020546001600160a01b031681565b610143610296366004611dd8565b610a54565b6102a485610a7b565b5f836001600160401b038111156102bd576102bd611f6f565b6040519080825280602002602001820160405280156102e6578160200160208202803683370190505b5090505f846001600160401b0381111561030257610302611f6f565b60405190808252806020026020018201604052801561032b578160200160208202803683370190505b5090505f805b8681101561051c575f88888381811061034c5761034c611f83565b9050602002013590506103608a3383610a9f565b61038557604051630e35d34560e11b8152600481018290526024015b60405180910390fd5b6040805160208082018d9052818301849052825180830384018152606090920183528151918101919091205f8181526007909252919020546001600160a01b0316806103e7576040516349a0267360e11b81526004810184905260240161037c565b5f82815260076020908152604080832080546001600160a01b0319169055338352600882528083208f845282528083208684529091528120805460ff19169055610432888784610b4b565b90505f19810361049a578188878151811061044f5761044f611f83565b60200260200101906001600160a01b031690816001600160a01b031681525050600187878151811061048357610483611f83565b6020026020010181815250508560010195506104bf565b8681815181106104ac576104ac611f83565b6020026020010180516001019081815250505b8c826001600160a01b0316336001600160a01b03167f3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b408298028760405161050591815260200190565b60405180910390a450505050806001019050610331565b505f5b818110156105e6575f84828151811061053a5761053a611f83565b602002602001015190505f610550888884610ba2565b90505f19810361057e5760405163e0a76e8560e01b81526001600160a01b038316600482015260240161037c565b6105dc8286858151811061059457610594611f83565b60200260200101516105a590611fab565b8a8a858181106105b7576105b7611f83565b90506020028101906105c99190611fc5565b6105d7906020810190611fe3565b610c06565b505060010161051f565b506002545f908152600360205260409020547f4a635896ff776c1806ba05b029b88147d206d56c6f3050d26ab67427b9b32b5c9060405190815260200160405180910390a15050505050505050565b6001600160a01b0381165f908152600560205260408120546001600160581b0316906106618383610e80565b9050915091565b6001600160a01b0381165f908152600560205260408120546106949083906001600160581b0316610e80565b92915050565b60606106a584610a7b565b5f805b8381101561071d575f8585838181106106c3576106c3611f83565b335f9081526008602090815260408083208d84528252808320938202959095013580835292905292909220549192505060ff1680156107085750610708873383610a9f565b15610714578260010192505b506001016106a8565b505f816001600160401b0381111561073757610737611f6f565b604051908082528060200260200182016040528015610760578160200160208202803683370190505b5090505f805b858110156107ff575f87878381811061078157610781611f83565b335f9081526008602090815260408083208f84528252808320938202959095013580835292905292909220549192505060ff1680156107c657506107c6893383610a9f565b156107f6578084846107d781612028565b9550815181106107e9576107e9611f83565b6020026020010181815250505b50600101610766565b5090925050505b9392505050565b606061081884610a7b565b816001600160401b0381111561083057610830611f6f565b604051908082528060200260200182016040528015610859578160200160208202803683370190505b5090505f5b828110156109045760075f6108b28787878681811061087f5761087f611f83565b90506020020135604080516020808201949094528082019290925280518083038201815260609092019052805191012090565b81526020019081526020015f205f9054906101000a90046001600160a01b03168282815181106108e4576108e4611f83565b6001600160a01b039092166020928302919091019091015260010161085e565b509392505050565b61091587610a7b565b6001600160a01b03881661093c5760405163d92e233d60e01b815260040160405180910390fd5b5f5f5f5f61094c8c8c8c8c610e9f565b9350935093509350805f036109745760405163fcea6b3560e01b815260040160405180910390fd5b61098184848489896111f7565b61098d8c828a8a610c06565b6002545f908152600360205260409020547f4a635896ff776c1806ba05b029b88147d206d56c6f3050d26ab67427b9b32b5c9060405190815260200160405180910390a1505050505050505050505050565b6109e887610a7b565b6001600160a01b038816610a0f5760405163d92e233d60e01b815260040160405180910390fd5b5f5f5f5f610a1f8c8c8c8c6112a3565b9350935093509350610a348484848b8b6115c3565b8015610a465761098d8c828888610c06565b505050505050505050505050565b5f8181548110610a62575f80fd5b5f918252602090912001546001600160a01b0316905081565b5f548110610a9c5760405163517172a160e11b815260040160405180910390fd5b50565b5f5f5f8581548110610ab357610ab3611f83565b5f9182526020918290206040805193840181529101546001600160a01b0390811680845291516331a9108f60e11b815260048101879052929350861691636352211e90602401602060405180830381865afa158015610b14573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610b389190612040565b6001600160a01b03161495945050505050565b5f805b83811015610b9757826001600160a01b0316858281518110610b7257610b72611f83565b60200260200101516001600160a01b031603610b8f579050610806565b600101610b4e565b505f19949350505050565b5f805b83811015610b9757826001600160a01b0316858583818110610bc957610bc9611f83565b9050602002810190610bdb9190611fc5565b610be9906020810190611dbd565b6001600160a01b031603610bfe579050610806565b600101610ba5565b8215610e7a576001600160a01b0384165f908152600560205260408120546001600160581b03169080851315610c6b576001600160581b03808316860190811115610c6457604051633643f37960e21b815260040160405180910390fd5b9050610caf565b5f610c7586611fab565b9050826001600160581b0316811115610ca157604051637b1304a960e11b815260040160405180910390fd5b6001600160581b0383160390505b5f610cba8784610e80565b90505f610cc78884610e80565b90505f5160206121b75f395f51905f5282101580610cf257505f5160206121b75f395f51905f528110155b15610d1057604051633643f37960e21b815260040160405180910390fd5b6001600160581b038416158015610d2f57505f836001600160581b0316115b15610d7857610d3f600182611644565b505f610d4c600183611803565b5f90815260066020526040902080546001600160a01b0319166001600160a01b038b1617905550610e00565b826001600160581b03165f03610dc4575f610d94600184611803565b9050610da3600184898961184e565b505f90815260066020526040902080546001600160a01b0319169055610e00565b5f859003610df05760405163e0a76e8560e01b81526001600160a01b038916600482015260240161037c565b610dfe600183838989611865565b505b6001600160a01b0388165f8181526005602090815260409182902080546affffffffffffffffffffff19166001600160581b0388811691821790925583519189168252918101919091527fee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b910160405180910390a2505050505b50505050565b6001600160581b031660589190911b600160581b600160f81b03161790565b6060805f80846001600160401b03811115610ebc57610ebc611f6f565b604051908082528060200260200182016040528015610ee5578160200160208202803683370190505b509350846001600160401b03811115610f0057610f00611f6f565b604051908082528060200260200182016040528015610f29578160200160208202803683370190505b5092505f5b858110156111eb575f878783818110610f4957610f49611f83565b60200291909101359150610f5a9050565b610f65893383610a9f565b610f8557604051630e35d34560e11b81526004810182905260240161037c565b6040805160208082018c9052818301849052825180830384018152606090920183528151918101919091205f8181526007909252919020546001600160a01b031680156110fb57335f9081526008602090815260408083208e8452825280832086845290915290205460ff16156110125760405163391fac8f60e21b81526004810184905260240161037c565b5f61101e898884610b4b565b90505f198103611086578189888151811061103b5761103b611f83565b60200260200101906001600160a01b031690816001600160a01b031681525050600188888151811061106f5761106f611f83565b6020026020010181815250508660010196506110ab565b87818151811061109857611098611f83565b6020026020010180516001019081815250505b8b826001600160a01b0316336001600160a01b03167f3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802876040516110f191815260200190565b60405180910390a4505b8b60075f8481526020019081526020015f205f6101000a8154816001600160a01b0302191690836001600160a01b03160217905550600160085f336001600160a01b03166001600160a01b031681526020019081526020015f205f8d81526020019081526020015f205f8581526020019081526020015f205f6101000a81548160ff0219169083151502179055508460010194508a8c6001600160a01b0316336001600160a01b03167f24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04866040516111d591815260200190565b60405180910390a4505050806001019050610f2e565b50945094509450949050565b5f5b8381101561129b575f86828151811061121457611214611f83565b602002602001015190505f61122a858584610ba2565b90505f1981036112585760405163e0a76e8560e01b81526001600160a01b038316600482015260240161037c565b6112918288858151811061126e5761126e611f83565b602002602001015161127f90611fab565b8787858181106105b7576105b7611f83565b50506001016111f9565b505050505050565b6060805f80846001600160401b038111156112c0576112c0611f6f565b6040519080825280602002602001820160405280156112e9578160200160208202803683370190505b509350846001600160401b0381111561130457611304611f6f565b60405190808252806020026020018201604052801561132d578160200160208202803683370190505b5092505f5b858110156111eb575f87878381811061134d5761134d611f83565b6020029190910135915061135e9050565b611369893383610a9f565b61138957604051630e35d34560e11b81526004810182905260240161037c565b6040805160208082018c9052818301849052825180830384018152606090920183528151918101919091205f8181526007909252919020546001600160a01b03908116908c1681036113dd575050506115bb565b6001600160a01b038116156114d5575f6113f8898884610b4b565b90505f198103611460578189888151811061141557611415611f83565b60200260200101906001600160a01b031690816001600160a01b031681525050600188888151811061144957611449611f83565b602002602001018181525050866001019650611485565b87818151811061147257611472611f83565b6020026020010180516001019081815250505b8b826001600160a01b0316336001600160a01b03167f3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802876040516114cb91815260200190565b60405180910390a4505b8b60075f8481526020019081526020015f205f6101000a8154816001600160a01b0302191690836001600160a01b03160217905550600160085f336001600160a01b03166001600160a01b031681526020019081526020015f205f8d81526020019081526020015f205f8581526020019081526020015f205f6101000a81548160ff0219169083151502179055508460010194508a8c6001600160a01b0316336001600160a01b03167f24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04866040516115af91815260200190565b60405180910390a45050505b600101611332565b5f5b8381101561129b575f8682815181106115e0576115e0611f83565b602002602001015190505f6115f6858584610ba2565b90505f1981036116245760405163e0a76e8560e01b81526001600160a01b038316600482015260240161037c565b61163a8288858151811061126e5761126e611f83565b50506001016115c5565b5f5f5160206121b75f395f51905f528210611672576040516361c0541760e11b815260040160405180910390fd5b815f03611692576040516314b48df160e11b815260040160405180910390fd5b5f828152600384016020526040902054156116c0576040516312c50cad60e11b815260040160405180910390fd5b8254600180850154906116d490839061205b565b6116df826002612151565b10156116f1576116ee81612028565b90505b60018501819055835f5b828110156117c9578084901c6001166001036117ae576040805180820182525f83815260028a0160209081529083902054825281018490529051632b0aac7f60e11b815273__$a2daaad8940c9006af3f1557205ebe532d$__9163561558fe91611768919060040161215c565b602060405180830381865af4158015611783573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117a7919061218c565b91506117c1565b5f81815260028801602052604090208290555b6001016116fb565b506117d383612028565b8087555f928352600287016020908152604080852084905596845260039097019096529390209390935550919050565b5f818152600383016020526040812054810361183257604051631c811d5b60e21b815260040160405180910390fd5b5f828152600384016020526040902054610806906001906121a3565b5f61185c85855f8686611865565b95945050505050565b5f5f5160206121b75f395f51905f528410611893576040516361c0541760e11b815260040160405180910390fd5b5f8581526003870160205260409020546118c057604051631c811d5b60e21b815260040160405180910390fd5b5f848152600387016020526040902054156118ee576040516312c50cad60e11b815260040160405180910390fd5b5f6118f98787611803565b8754909150859087905f90611910906001906121a3565b60018b01549091505f90815b81811015611c66578087901c600116600103611aca575f5160206121b75f395f51905f528a8a8581811061195257611952611f83565b9050602002013510611977576040516361c0541760e11b815260040160405180910390fd5b73__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808d8d888181106119ae576119ae611f83565b905060200201358152602001898152506040518263ffffffff1660e01b81526004016119da919061215c565b602060405180830381865af41580156119f5573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611a19919061218c565b955073__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808d8d88818110611a5257611a52611f83565b905060200201358152602001888152506040518263ffffffff1660e01b8152600401611a7e919061215c565b602060405180830381865af4158015611a99573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611abd919061218c565b9450826001019250611c5e565b86811c84821c14611c4b575f5160206121b75f395f51905f528a8a85818110611af557611af5611f83565b9050602002013510611b1a576040516361c0541760e11b815260040160405180910390fd5b5f81815260028e016020526040902054859003611b44575f81815260028e01602052604090208690555b73__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808981526020018d8d88818110611b8157611b81611f83565b905060200201358152506040518263ffffffff1660e01b8152600401611ba7919061215c565b602060405180830381865af4158015611bc2573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611be6919061218c565b955073__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808881526020018d8d88818110611c2557611c25611f83565b905060200201358152506040518263ffffffff1660e01b8152600401611a7e919061215c565b5f81815260028e01602052604090208690555b60010161191c565b5060018c01545f90815260028d0160205260409020548414611c9b57604051631fd4986360e11b815260040160405180910390fd5b5f81815260028d01602052604090208590558915611ccb575f8b815260038d016020526040808220548c83529120555b5050505f88815260038a0160205260408120555091505095945050505050565b5f5f83601f840112611cfb575f5ffd5b5081356001600160401b03811115611d11575f5ffd5b6020830191508360208260051b8501011115611d2b575f5ffd5b9250929050565b5f5f5f5f5f60608688031215611d46575f5ffd5b8535945060208601356001600160401b03811115611d62575f5ffd5b611d6e88828901611ceb565b90955093505060408601356001600160401b03811115611d8c575f5ffd5b611d9888828901611ceb565b969995985093965092949392505050565b6001600160a01b0381168114610a9c575f5ffd5b5f60208284031215611dcd575f5ffd5b813561080681611da9565b5f60208284031215611de8575f5ffd5b5035919050565b5f5f5f60408486031215611e01575f5ffd5b8335925060208401356001600160401b03811115611e1d575f5ffd5b611e2986828701611ceb565b9497909650939450505050565b602080825282518282018190525f918401906040840190835b81811015611e6d578351835260209384019390920191600101611e4f565b509095945050505050565b602080825282518282018190525f918401906040840190835b81811015611e6d5783516001600160a01b0316835260209384019390920191600101611e91565b5f5f5f5f5f5f5f5f60a0898b031215611ecf575f5ffd5b8835611eda81611da9565b97506020890135965060408901356001600160401b03811115611efb575f5ffd5b611f078b828c01611ceb565b90975095505060608901356001600160401b03811115611f25575f5ffd5b611f318b828c01611ceb565b90955093505060808901356001600160401b03811115611f4f575f5ffd5b611f5b8b828c01611ceb565b999c989b5096995094979396929594505050565b634e487b7160e01b5f52604160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b5f600160ff1b8201611fbf57611fbf611f97565b505f0390565b5f8235603e19833603018112611fd9575f5ffd5b9190910192915050565b5f5f8335601e19843603018112611ff8575f5ffd5b8301803591506001600160401b03821115612011575f5ffd5b6020019150600581901b3603821315611d2b575f5ffd5b5f6001820161203957612039611f97565b5060010190565b5f60208284031215612050575f5ffd5b815161080681611da9565b8082018082111561069457610694611f97565b6001815b60018411156120a95780850481111561208d5761208d611f97565b600184161561209b57908102905b60019390931c928002612072565b935093915050565b5f826120bf57506001610694565b816120cb57505f610694565b81600181146120e157600281146120eb57612107565b6001915050610694565b60ff8411156120fc576120fc611f97565b50506001821b610694565b5060208310610133831016604e8410600b841016171561212a575081810a610694565b6121365f19848461206e565b805f190482111561214957612149611f97565b029392505050565b5f61080683836120b1565b6040810181835f5b6002811015612183578151835260209283019290910190600101612164565b50505092915050565b5f6020828403121561219c575f5ffd5b5051919050565b8181038181111561069457610694611f9756fe30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001a2646970667358221220839e7b48e51419e12789db9d87bb928c2e4329b25efdc06979afd6a2fc603fb564736f6c634300081e0033",
}

// DavinciDaoCensusABI is the input ABI used to generate the binding from.
// Deprecated: Use DavinciDaoCensusMetaData.ABI instead.
var DavinciDaoCensusABI = DavinciDaoCensusMetaData.ABI

// DavinciDaoCensusBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use DavinciDaoCensusMetaData.Bin instead.
var DavinciDaoCensusBin = DavinciDaoCensusMetaData.Bin

// DeployDavinciDaoCensus deploys a new Ethereum contract, binding an instance of DavinciDaoCensus to it.
func DeployDavinciDaoCensus(auth *bind.TransactOpts, backend bind.ContractBackend, tokens []common.Address) (common.Address, *types.Transaction, *DavinciDaoCensus, error) {
	parsed, err := DavinciDaoCensusMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(DavinciDaoCensusBin), backend, tokens)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &DavinciDaoCensus{DavinciDaoCensusCaller: DavinciDaoCensusCaller{contract: contract}, DavinciDaoCensusTransactor: DavinciDaoCensusTransactor{contract: contract}, DavinciDaoCensusFilterer: DavinciDaoCensusFilterer{contract: contract}}, nil
}

// DavinciDaoCensus is an auto generated Go binding around an Ethereum contract.
type DavinciDaoCensus struct {
	DavinciDaoCensusCaller     // Read-only binding to the contract
	DavinciDaoCensusTransactor // Write-only binding to the contract
	DavinciDaoCensusFilterer   // Log filterer for contract events
}

// DavinciDaoCensusCaller is an auto generated read-only Go binding around an Ethereum contract.
type DavinciDaoCensusCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DavinciDaoCensusTransactor is an auto generated write-only Go binding around an Ethereum contract.
type DavinciDaoCensusTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DavinciDaoCensusFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type DavinciDaoCensusFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DavinciDaoCensusSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type DavinciDaoCensusSession struct {
	Contract     *DavinciDaoCensus // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// DavinciDaoCensusCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type DavinciDaoCensusCallerSession struct {
	Contract *DavinciDaoCensusCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts           // Call options to use throughout this session
}

// DavinciDaoCensusTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type DavinciDaoCensusTransactorSession struct {
	Contract     *DavinciDaoCensusTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts           // Transaction auth options to use throughout this session
}

// DavinciDaoCensusRaw is an auto generated low-level Go binding around an Ethereum contract.
type DavinciDaoCensusRaw struct {
	Contract *DavinciDaoCensus // Generic contract binding to access the raw methods on
}

// DavinciDaoCensusCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type DavinciDaoCensusCallerRaw struct {
	Contract *DavinciDaoCensusCaller // Generic read-only contract binding to access the raw methods on
}

// DavinciDaoCensusTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type DavinciDaoCensusTransactorRaw struct {
	Contract *DavinciDaoCensusTransactor // Generic write-only contract binding to access the raw methods on
}

// NewDavinciDaoCensus creates a new instance of DavinciDaoCensus, bound to a specific deployed contract.
func NewDavinciDaoCensus(address common.Address, backend bind.ContractBackend) (*DavinciDaoCensus, error) {
	contract, err := bindDavinciDaoCensus(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensus{DavinciDaoCensusCaller: DavinciDaoCensusCaller{contract: contract}, DavinciDaoCensusTransactor: DavinciDaoCensusTransactor{contract: contract}, DavinciDaoCensusFilterer: DavinciDaoCensusFilterer{contract: contract}}, nil
}

// NewDavinciDaoCensusCaller creates a new read-only instance of DavinciDaoCensus, bound to a specific deployed contract.
func NewDavinciDaoCensusCaller(address common.Address, caller bind.ContractCaller) (*DavinciDaoCensusCaller, error) {
	contract, err := bindDavinciDaoCensus(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusCaller{contract: contract}, nil
}

// NewDavinciDaoCensusTransactor creates a new write-only instance of DavinciDaoCensus, bound to a specific deployed contract.
func NewDavinciDaoCensusTransactor(address common.Address, transactor bind.ContractTransactor) (*DavinciDaoCensusTransactor, error) {
	contract, err := bindDavinciDaoCensus(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusTransactor{contract: contract}, nil
}

// NewDavinciDaoCensusFilterer creates a new log filterer instance of DavinciDaoCensus, bound to a specific deployed contract.
func NewDavinciDaoCensusFilterer(address common.Address, filterer bind.ContractFilterer) (*DavinciDaoCensusFilterer, error) {
	contract, err := bindDavinciDaoCensus(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusFilterer{contract: contract}, nil
}

// bindDavinciDaoCensus binds a generic wrapper to an already deployed contract.
func bindDavinciDaoCensus(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := DavinciDaoCensusMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DavinciDaoCensus *DavinciDaoCensusRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DavinciDaoCensus.Contract.DavinciDaoCensusCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DavinciDaoCensus *DavinciDaoCensusRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.DavinciDaoCensusTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DavinciDaoCensus *DavinciDaoCensusRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.DavinciDaoCensusTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DavinciDaoCensus *DavinciDaoCensusCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DavinciDaoCensus.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DavinciDaoCensus *DavinciDaoCensusTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DavinciDaoCensus *DavinciDaoCensusTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.contract.Transact(opts, method, params...)
}

// Collections is a free data retrieval call binding the contract method 0xfdbda0ec.
//
// Solidity: function collections(uint256 ) view returns(address token)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) Collections(opts *bind.CallOpts, arg0 *big.Int) (common.Address, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "collections", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Collections is a free data retrieval call binding the contract method 0xfdbda0ec.
//
// Solidity: function collections(uint256 ) view returns(address token)
func (_DavinciDaoCensus *DavinciDaoCensusSession) Collections(arg0 *big.Int) (common.Address, error) {
	return _DavinciDaoCensus.Contract.Collections(&_DavinciDaoCensus.CallOpts, arg0)
}

// Collections is a free data retrieval call binding the contract method 0xfdbda0ec.
//
// Solidity: function collections(uint256 ) view returns(address token)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) Collections(arg0 *big.Int) (common.Address, error) {
	return _DavinciDaoCensus.Contract.Collections(&_DavinciDaoCensus.CallOpts, arg0)
}

// ComputeLeaf is a free data retrieval call binding the contract method 0x7b6c7c71.
//
// Solidity: function computeLeaf(address account) view returns(uint256)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) ComputeLeaf(opts *bind.CallOpts, account common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "computeLeaf", account)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// ComputeLeaf is a free data retrieval call binding the contract method 0x7b6c7c71.
//
// Solidity: function computeLeaf(address account) view returns(uint256)
func (_DavinciDaoCensus *DavinciDaoCensusSession) ComputeLeaf(account common.Address) (*big.Int, error) {
	return _DavinciDaoCensus.Contract.ComputeLeaf(&_DavinciDaoCensus.CallOpts, account)
}

// ComputeLeaf is a free data retrieval call binding the contract method 0x7b6c7c71.
//
// Solidity: function computeLeaf(address account) view returns(uint256)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) ComputeLeaf(account common.Address) (*big.Int, error) {
	return _DavinciDaoCensus.Contract.ComputeLeaf(&_DavinciDaoCensus.CallOpts, account)
}

// GetAccountAt is a free data retrieval call binding the contract method 0xf157c0ac.
//
// Solidity: function getAccountAt(uint256 index) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) GetAccountAt(opts *bind.CallOpts, index *big.Int) (common.Address, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "getAccountAt", index)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetAccountAt is a free data retrieval call binding the contract method 0xf157c0ac.
//
// Solidity: function getAccountAt(uint256 index) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusSession) GetAccountAt(index *big.Int) (common.Address, error) {
	return _DavinciDaoCensus.Contract.GetAccountAt(&_DavinciDaoCensus.CallOpts, index)
}

// GetAccountAt is a free data retrieval call binding the contract method 0xf157c0ac.
//
// Solidity: function getAccountAt(uint256 index) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) GetAccountAt(index *big.Int) (common.Address, error) {
	return _DavinciDaoCensus.Contract.GetAccountAt(&_DavinciDaoCensus.CallOpts, index)
}

// GetCensusRoot is a free data retrieval call binding the contract method 0xc1da8691.
//
// Solidity: function getCensusRoot() view returns(uint256)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) GetCensusRoot(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "getCensusRoot")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetCensusRoot is a free data retrieval call binding the contract method 0xc1da8691.
//
// Solidity: function getCensusRoot() view returns(uint256)
func (_DavinciDaoCensus *DavinciDaoCensusSession) GetCensusRoot() (*big.Int, error) {
	return _DavinciDaoCensus.Contract.GetCensusRoot(&_DavinciDaoCensus.CallOpts)
}

// GetCensusRoot is a free data retrieval call binding the contract method 0xc1da8691.
//
// Solidity: function getCensusRoot() view returns(uint256)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) GetCensusRoot() (*big.Int, error) {
	return _DavinciDaoCensus.Contract.GetCensusRoot(&_DavinciDaoCensus.CallOpts)
}

// GetDelegations is a free data retrieval call binding the contract method 0x31cc13ba.
//
// Solidity: function getDelegations(address account) view returns(uint88 weight, uint256 leaf)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) GetDelegations(opts *bind.CallOpts, account common.Address) (struct {
	Weight *big.Int
	Leaf   *big.Int
}, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "getDelegations", account)

	outstruct := new(struct {
		Weight *big.Int
		Leaf   *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Weight = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.Leaf = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetDelegations is a free data retrieval call binding the contract method 0x31cc13ba.
//
// Solidity: function getDelegations(address account) view returns(uint88 weight, uint256 leaf)
func (_DavinciDaoCensus *DavinciDaoCensusSession) GetDelegations(account common.Address) (struct {
	Weight *big.Int
	Leaf   *big.Int
}, error) {
	return _DavinciDaoCensus.Contract.GetDelegations(&_DavinciDaoCensus.CallOpts, account)
}

// GetDelegations is a free data retrieval call binding the contract method 0x31cc13ba.
//
// Solidity: function getDelegations(address account) view returns(uint88 weight, uint256 leaf)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) GetDelegations(account common.Address) (struct {
	Weight *big.Int
	Leaf   *big.Int
}, error) {
	return _DavinciDaoCensus.Contract.GetDelegations(&_DavinciDaoCensus.CallOpts, account)
}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[])
func (_DavinciDaoCensus *DavinciDaoCensusCaller) GetNFTids(opts *bind.CallOpts, nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "getNFTids", nftIndex, candidateIds)

	if err != nil {
		return *new([]*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new([]*big.Int)).(*[]*big.Int)

	return out0, err

}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[])
func (_DavinciDaoCensus *DavinciDaoCensusSession) GetNFTids(nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	return _DavinciDaoCensus.Contract.GetNFTids(&_DavinciDaoCensus.CallOpts, nftIndex, candidateIds)
}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[])
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) GetNFTids(nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	return _DavinciDaoCensus.Contract.GetNFTids(&_DavinciDaoCensus.CallOpts, nftIndex, candidateIds)
}

// GetTokenDelegations is a free data retrieval call binding the contract method 0xc333b0f1.
//
// Solidity: function getTokenDelegations(uint256 nftIndex, uint256[] ids) view returns(address[] delegates)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) GetTokenDelegations(opts *bind.CallOpts, nftIndex *big.Int, ids []*big.Int) ([]common.Address, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "getTokenDelegations", nftIndex, ids)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetTokenDelegations is a free data retrieval call binding the contract method 0xc333b0f1.
//
// Solidity: function getTokenDelegations(uint256 nftIndex, uint256[] ids) view returns(address[] delegates)
func (_DavinciDaoCensus *DavinciDaoCensusSession) GetTokenDelegations(nftIndex *big.Int, ids []*big.Int) ([]common.Address, error) {
	return _DavinciDaoCensus.Contract.GetTokenDelegations(&_DavinciDaoCensus.CallOpts, nftIndex, ids)
}

// GetTokenDelegations is a free data retrieval call binding the contract method 0xc333b0f1.
//
// Solidity: function getTokenDelegations(uint256 nftIndex, uint256[] ids) view returns(address[] delegates)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) GetTokenDelegations(nftIndex *big.Int, ids []*big.Int) ([]common.Address, error) {
	return _DavinciDaoCensus.Contract.GetTokenDelegations(&_DavinciDaoCensus.CallOpts, nftIndex, ids)
}

// IndexAccount is a free data retrieval call binding the contract method 0xf8fee8ed.
//
// Solidity: function indexAccount(uint256 ) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) IndexAccount(opts *bind.CallOpts, arg0 *big.Int) (common.Address, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "indexAccount", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// IndexAccount is a free data retrieval call binding the contract method 0xf8fee8ed.
//
// Solidity: function indexAccount(uint256 ) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusSession) IndexAccount(arg0 *big.Int) (common.Address, error) {
	return _DavinciDaoCensus.Contract.IndexAccount(&_DavinciDaoCensus.CallOpts, arg0)
}

// IndexAccount is a free data retrieval call binding the contract method 0xf8fee8ed.
//
// Solidity: function indexAccount(uint256 ) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) IndexAccount(arg0 *big.Int) (common.Address, error) {
	return _DavinciDaoCensus.Contract.IndexAccount(&_DavinciDaoCensus.CallOpts, arg0)
}

// TokenDelegate is a free data retrieval call binding the contract method 0x66e12bef.
//
// Solidity: function tokenDelegate(bytes32 ) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) TokenDelegate(opts *bind.CallOpts, arg0 [32]byte) (common.Address, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "tokenDelegate", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// TokenDelegate is a free data retrieval call binding the contract method 0x66e12bef.
//
// Solidity: function tokenDelegate(bytes32 ) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusSession) TokenDelegate(arg0 [32]byte) (common.Address, error) {
	return _DavinciDaoCensus.Contract.TokenDelegate(&_DavinciDaoCensus.CallOpts, arg0)
}

// TokenDelegate is a free data retrieval call binding the contract method 0x66e12bef.
//
// Solidity: function tokenDelegate(bytes32 ) view returns(address)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) TokenDelegate(arg0 [32]byte) (common.Address, error) {
	return _DavinciDaoCensus.Contract.TokenDelegate(&_DavinciDaoCensus.CallOpts, arg0)
}

// WeightOf is a free data retrieval call binding the contract method 0xdd4bc101.
//
// Solidity: function weightOf(address ) view returns(uint88)
func (_DavinciDaoCensus *DavinciDaoCensusCaller) WeightOf(opts *bind.CallOpts, arg0 common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDaoCensus.contract.Call(opts, &out, "weightOf", arg0)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// WeightOf is a free data retrieval call binding the contract method 0xdd4bc101.
//
// Solidity: function weightOf(address ) view returns(uint88)
func (_DavinciDaoCensus *DavinciDaoCensusSession) WeightOf(arg0 common.Address) (*big.Int, error) {
	return _DavinciDaoCensus.Contract.WeightOf(&_DavinciDaoCensus.CallOpts, arg0)
}

// WeightOf is a free data retrieval call binding the contract method 0xdd4bc101.
//
// Solidity: function weightOf(address ) view returns(uint88)
func (_DavinciDaoCensus *DavinciDaoCensusCallerSession) WeightOf(arg0 common.Address) (*big.Int, error) {
	return _DavinciDaoCensus.Contract.WeightOf(&_DavinciDaoCensus.CallOpts, arg0)
}

// Delegate is a paid mutator transaction binding the contract method 0xd0424d7c.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, (address,uint256[])[] fromProofs) returns()
func (_DavinciDaoCensus *DavinciDaoCensusTransactor) Delegate(opts *bind.TransactOpts, to common.Address, nftIndex *big.Int, ids []*big.Int, toProof []*big.Int, fromProofs []DavinciDaoCensusProofInput) (*types.Transaction, error) {
	return _DavinciDaoCensus.contract.Transact(opts, "delegate", to, nftIndex, ids, toProof, fromProofs)
}

// Delegate is a paid mutator transaction binding the contract method 0xd0424d7c.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, (address,uint256[])[] fromProofs) returns()
func (_DavinciDaoCensus *DavinciDaoCensusSession) Delegate(to common.Address, nftIndex *big.Int, ids []*big.Int, toProof []*big.Int, fromProofs []DavinciDaoCensusProofInput) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.Delegate(&_DavinciDaoCensus.TransactOpts, to, nftIndex, ids, toProof, fromProofs)
}

// Delegate is a paid mutator transaction binding the contract method 0xd0424d7c.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, (address,uint256[])[] fromProofs) returns()
func (_DavinciDaoCensus *DavinciDaoCensusTransactorSession) Delegate(to common.Address, nftIndex *big.Int, ids []*big.Int, toProof []*big.Int, fromProofs []DavinciDaoCensusProofInput) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.Delegate(&_DavinciDaoCensus.TransactOpts, to, nftIndex, ids, toProof, fromProofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0x1b1db502.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint256[])[] proofs) returns()
func (_DavinciDaoCensus *DavinciDaoCensusTransactor) Undelegate(opts *bind.TransactOpts, nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoCensusProofInput) (*types.Transaction, error) {
	return _DavinciDaoCensus.contract.Transact(opts, "undelegate", nftIndex, ids, proofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0x1b1db502.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint256[])[] proofs) returns()
func (_DavinciDaoCensus *DavinciDaoCensusSession) Undelegate(nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoCensusProofInput) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.Undelegate(&_DavinciDaoCensus.TransactOpts, nftIndex, ids, proofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0x1b1db502.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint256[])[] proofs) returns()
func (_DavinciDaoCensus *DavinciDaoCensusTransactorSession) Undelegate(nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoCensusProofInput) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.Undelegate(&_DavinciDaoCensus.TransactOpts, nftIndex, ids, proofs)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0xd4d10661.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, (address,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDaoCensus *DavinciDaoCensusTransactor) UpdateDelegation(opts *bind.TransactOpts, to common.Address, nftIndex *big.Int, ids []*big.Int, fromProofs []DavinciDaoCensusProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDaoCensus.contract.Transact(opts, "updateDelegation", to, nftIndex, ids, fromProofs, toProof)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0xd4d10661.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, (address,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDaoCensus *DavinciDaoCensusSession) UpdateDelegation(to common.Address, nftIndex *big.Int, ids []*big.Int, fromProofs []DavinciDaoCensusProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.UpdateDelegation(&_DavinciDaoCensus.TransactOpts, to, nftIndex, ids, fromProofs, toProof)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0xd4d10661.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, (address,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDaoCensus *DavinciDaoCensusTransactorSession) UpdateDelegation(to common.Address, nftIndex *big.Int, ids []*big.Int, fromProofs []DavinciDaoCensusProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDaoCensus.Contract.UpdateDelegation(&_DavinciDaoCensus.TransactOpts, to, nftIndex, ids, fromProofs, toProof)
}

// DavinciDaoCensusCensusRootUpdatedIterator is returned from FilterCensusRootUpdated and is used to iterate over the raw logs and unpacked data for CensusRootUpdated events raised by the DavinciDaoCensus contract.
type DavinciDaoCensusCensusRootUpdatedIterator struct {
	Event *DavinciDaoCensusCensusRootUpdated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *DavinciDaoCensusCensusRootUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoCensusCensusRootUpdated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(DavinciDaoCensusCensusRootUpdated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *DavinciDaoCensusCensusRootUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoCensusCensusRootUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoCensusCensusRootUpdated represents a CensusRootUpdated event raised by the DavinciDaoCensus contract.
type DavinciDaoCensusCensusRootUpdated struct {
	NewRoot *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterCensusRootUpdated is a free log retrieval operation binding the contract event 0x4a635896ff776c1806ba05b029b88147d206d56c6f3050d26ab67427b9b32b5c.
//
// Solidity: event CensusRootUpdated(uint256 newRoot)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) FilterCensusRootUpdated(opts *bind.FilterOpts) (*DavinciDaoCensusCensusRootUpdatedIterator, error) {

	logs, sub, err := _DavinciDaoCensus.contract.FilterLogs(opts, "CensusRootUpdated")
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusCensusRootUpdatedIterator{contract: _DavinciDaoCensus.contract, event: "CensusRootUpdated", logs: logs, sub: sub}, nil
}

// WatchCensusRootUpdated is a free log subscription operation binding the contract event 0x4a635896ff776c1806ba05b029b88147d206d56c6f3050d26ab67427b9b32b5c.
//
// Solidity: event CensusRootUpdated(uint256 newRoot)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) WatchCensusRootUpdated(opts *bind.WatchOpts, sink chan<- *DavinciDaoCensusCensusRootUpdated) (event.Subscription, error) {

	logs, sub, err := _DavinciDaoCensus.contract.WatchLogs(opts, "CensusRootUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoCensusCensusRootUpdated)
				if err := _DavinciDaoCensus.contract.UnpackLog(event, "CensusRootUpdated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseCensusRootUpdated is a log parse operation binding the contract event 0x4a635896ff776c1806ba05b029b88147d206d56c6f3050d26ab67427b9b32b5c.
//
// Solidity: event CensusRootUpdated(uint256 newRoot)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) ParseCensusRootUpdated(log types.Log) (*DavinciDaoCensusCensusRootUpdated, error) {
	event := new(DavinciDaoCensusCensusRootUpdated)
	if err := _DavinciDaoCensus.contract.UnpackLog(event, "CensusRootUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DavinciDaoCensusDelegatedIterator is returned from FilterDelegated and is used to iterate over the raw logs and unpacked data for Delegated events raised by the DavinciDaoCensus contract.
type DavinciDaoCensusDelegatedIterator struct {
	Event *DavinciDaoCensusDelegated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *DavinciDaoCensusDelegatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoCensusDelegated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(DavinciDaoCensusDelegated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *DavinciDaoCensusDelegatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoCensusDelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoCensusDelegated represents a Delegated event raised by the DavinciDaoCensus contract.
type DavinciDaoCensusDelegated struct {
	Owner    common.Address
	To       common.Address
	NftIndex *big.Int
	TokenId  *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterDelegated is a free log retrieval operation binding the contract event 0x24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04.
//
// Solidity: event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) FilterDelegated(opts *bind.FilterOpts, owner []common.Address, to []common.Address, nftIndex []*big.Int) (*DavinciDaoCensusDelegatedIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}
	var nftIndexRule []interface{}
	for _, nftIndexItem := range nftIndex {
		nftIndexRule = append(nftIndexRule, nftIndexItem)
	}

	logs, sub, err := _DavinciDaoCensus.contract.FilterLogs(opts, "Delegated", ownerRule, toRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusDelegatedIterator{contract: _DavinciDaoCensus.contract, event: "Delegated", logs: logs, sub: sub}, nil
}

// WatchDelegated is a free log subscription operation binding the contract event 0x24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04.
//
// Solidity: event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) WatchDelegated(opts *bind.WatchOpts, sink chan<- *DavinciDaoCensusDelegated, owner []common.Address, to []common.Address, nftIndex []*big.Int) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}
	var nftIndexRule []interface{}
	for _, nftIndexItem := range nftIndex {
		nftIndexRule = append(nftIndexRule, nftIndexItem)
	}

	logs, sub, err := _DavinciDaoCensus.contract.WatchLogs(opts, "Delegated", ownerRule, toRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoCensusDelegated)
				if err := _DavinciDaoCensus.contract.UnpackLog(event, "Delegated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseDelegated is a log parse operation binding the contract event 0x24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04.
//
// Solidity: event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) ParseDelegated(log types.Log) (*DavinciDaoCensusDelegated, error) {
	event := new(DavinciDaoCensusDelegated)
	if err := _DavinciDaoCensus.contract.UnpackLog(event, "Delegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DavinciDaoCensusUndelegatedIterator is returned from FilterUndelegated and is used to iterate over the raw logs and unpacked data for Undelegated events raised by the DavinciDaoCensus contract.
type DavinciDaoCensusUndelegatedIterator struct {
	Event *DavinciDaoCensusUndelegated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *DavinciDaoCensusUndelegatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoCensusUndelegated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(DavinciDaoCensusUndelegated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *DavinciDaoCensusUndelegatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoCensusUndelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoCensusUndelegated represents a Undelegated event raised by the DavinciDaoCensus contract.
type DavinciDaoCensusUndelegated struct {
	Owner    common.Address
	From     common.Address
	NftIndex *big.Int
	TokenId  *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterUndelegated is a free log retrieval operation binding the contract event 0x3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802.
//
// Solidity: event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) FilterUndelegated(opts *bind.FilterOpts, owner []common.Address, from []common.Address, nftIndex []*big.Int) (*DavinciDaoCensusUndelegatedIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var nftIndexRule []interface{}
	for _, nftIndexItem := range nftIndex {
		nftIndexRule = append(nftIndexRule, nftIndexItem)
	}

	logs, sub, err := _DavinciDaoCensus.contract.FilterLogs(opts, "Undelegated", ownerRule, fromRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusUndelegatedIterator{contract: _DavinciDaoCensus.contract, event: "Undelegated", logs: logs, sub: sub}, nil
}

// WatchUndelegated is a free log subscription operation binding the contract event 0x3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802.
//
// Solidity: event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) WatchUndelegated(opts *bind.WatchOpts, sink chan<- *DavinciDaoCensusUndelegated, owner []common.Address, from []common.Address, nftIndex []*big.Int) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var nftIndexRule []interface{}
	for _, nftIndexItem := range nftIndex {
		nftIndexRule = append(nftIndexRule, nftIndexItem)
	}

	logs, sub, err := _DavinciDaoCensus.contract.WatchLogs(opts, "Undelegated", ownerRule, fromRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoCensusUndelegated)
				if err := _DavinciDaoCensus.contract.UnpackLog(event, "Undelegated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseUndelegated is a log parse operation binding the contract event 0x3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802.
//
// Solidity: event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) ParseUndelegated(log types.Log) (*DavinciDaoCensusUndelegated, error) {
	event := new(DavinciDaoCensusUndelegated)
	if err := _DavinciDaoCensus.contract.UnpackLog(event, "Undelegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DavinciDaoCensusWeightChangedIterator is returned from FilterWeightChanged and is used to iterate over the raw logs and unpacked data for WeightChanged events raised by the DavinciDaoCensus contract.
type DavinciDaoCensusWeightChangedIterator struct {
	Event *DavinciDaoCensusWeightChanged // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *DavinciDaoCensusWeightChangedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoCensusWeightChanged)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(DavinciDaoCensusWeightChanged)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *DavinciDaoCensusWeightChangedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoCensusWeightChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoCensusWeightChanged represents a WeightChanged event raised by the DavinciDaoCensus contract.
type DavinciDaoCensusWeightChanged struct {
	Account        common.Address
	PreviousWeight *big.Int
	NewWeight      *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterWeightChanged is a free log retrieval operation binding the contract event 0xee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b.
//
// Solidity: event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) FilterWeightChanged(opts *bind.FilterOpts, account []common.Address) (*DavinciDaoCensusWeightChangedIterator, error) {

	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}

	logs, sub, err := _DavinciDaoCensus.contract.FilterLogs(opts, "WeightChanged", accountRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusWeightChangedIterator{contract: _DavinciDaoCensus.contract, event: "WeightChanged", logs: logs, sub: sub}, nil
}

// WatchWeightChanged is a free log subscription operation binding the contract event 0xee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b.
//
// Solidity: event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) WatchWeightChanged(opts *bind.WatchOpts, sink chan<- *DavinciDaoCensusWeightChanged, account []common.Address) (event.Subscription, error) {

	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}

	logs, sub, err := _DavinciDaoCensus.contract.WatchLogs(opts, "WeightChanged", accountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoCensusWeightChanged)
				if err := _DavinciDaoCensus.contract.UnpackLog(event, "WeightChanged", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseWeightChanged is a log parse operation binding the contract event 0xee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b.
//
// Solidity: event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight)
func (_DavinciDaoCensus *DavinciDaoCensusFilterer) ParseWeightChanged(log types.Log) (*DavinciDaoCensusWeightChanged, error) {
	event := new(DavinciDaoCensusWeightChanged)
	if err := _DavinciDaoCensus.contract.UnpackLog(event, "WeightChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
