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

// DavinciDaoProofInput is an auto generated low-level Go binding around an user-defined struct.
type DavinciDaoProofInput struct {
	Account  common.Address
	Siblings []*big.Int
}

// DavinciDaoMetaData contains all meta data concerning the DavinciDao contract.
var DavinciDaoMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"tokens\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"collections\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"token\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"computeLeaf\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"delegate\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"toProof\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"fromProofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDao.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getAccountAt\",\"inputs\":[{\"name\":\"index\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getCensusRoot\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getDelegations\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"weight\",\"type\":\"uint88\",\"internalType\":\"uint88\"},{\"name\":\"leaf\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getNFTids\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"candidateIds\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRootBlockNumber\",\"inputs\":[{\"name\":\"root\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getTokenDelegations\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[{\"name\":\"delegates\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"indexAccount\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"rootBlockNumbers\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"tokenDelegate\",\"inputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"undelegate\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"proofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDao.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"updateDelegation\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"fromProofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDao.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]},{\"name\":\"toProof\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"weightOf\",\"inputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint88\",\"internalType\":\"uint88\"}],\"stateMutability\":\"view\"},{\"type\":\"event\",\"name\":\"CensusRootUpdated\",\"inputs\":[{\"name\":\"newRoot\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"blockNumber\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Delegated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"to\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Undelegated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"from\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"WeightChanged\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"previousWeight\",\"type\":\"uint88\",\"indexed\":false,\"internalType\":\"uint88\"},{\"name\":\"newWeight\",\"type\":\"uint88\",\"indexed\":false,\"internalType\":\"uint88\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"AlreadyDelegated\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"InvalidCollection\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"InvalidTokenId\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"LeafAlreadyExists\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafCannotBeZero\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafDoesNotExist\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafGreaterThanSnarkScalarField\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NoNewDelegations\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NotDelegated\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"NotTokenOwner\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"ProofRequired\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"WeightOverflow\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WeightUnderflow\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WrongSiblingNodes\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ZeroAddress\",\"inputs\":[]}]",
	Bin: "0x608060405234801561000f575f5ffd5b5060405161241738038061241783398101604081905261002e91610117565b80518061006e5760405162461bcd60e51b815260206004820152600a60248201526962616420636f6e66696760b01b604482015260640160405180910390fd5b5f5b818110156100e0575f8054600101815580528251839082908110610096576100966101e1565b60200260200101515f82815481106100b0576100b06101e1565b5f91825260209091200180546001600160a01b0319166001600160a01b0392909216919091179055600101610070565b5050506101f5565b634e487b7160e01b5f52604160045260245ffd5b80516001600160a01b0381168114610112575f5ffd5b919050565b5f60208284031215610127575f5ffd5b81516001600160401b0381111561013c575f5ffd5b8201601f8101841361014c575f5ffd5b80516001600160401b03811115610165576101656100e8565b604051600582901b90603f8201601f191681016001600160401b0381118282101715610193576101936100e8565b6040529182526020818401810192908101878411156101b0575f5ffd5b6020850194505b838510156101d6576101c8856100fc565b8152602094850194016101b7565b509695505050505050565b634e487b7160e01b5f52603260045260245ffd5b612215806102025f395ff3fe608060405234801561000f575f5ffd5b50600436106100f0575f3560e01c8063c1da869111610093578063dd4bc10111610063578063dd4bc1011461025b578063f157c0ac1461029b578063f8fee8ed146102c3578063fdbda0ec146102eb575f5ffd5b8063c1da8691146101ff578063c333b0f114610215578063d0424d7c14610235578063d4d1066114610248575f5ffd5b8063650e5fcf116100ce578063650e5fcf1461016d57806366e12bef1461018c5780637b6c7c71146101cc5780638498be04146101df575f5ffd5b80631b1db502146100f457806331cc13ba1461010957806341a3828214610140575b5f5ffd5b610107610102366004611d3b565b6102fe565b005b61011c610117366004611dc6565b61065c565b604080516001600160581b0390931683526020830191909152015b60405180910390f35b61015f61014e366004611de1565b60096020525f908152604090205481565b604051908152602001610137565b61015f61017b366004611de1565b5f9081526009602052604090205490565b6101b461019a366004611de1565b60076020525f90815260409020546001600160a01b031681565b6040516001600160a01b039091168152602001610137565b61015f6101da366004611dc6565b61068f565b6101f26101ed366004611df8565b6106c1565b6040516101379190611e3f565b6002545f9081526003602052604090205461015f565b610228610223366004611df8565b610834565b6040516101379190611e81565b610107610243366004611ec1565b610933565b610107610256366004611ec1565b6109ca565b610283610269366004611dc6565b60056020525f90815260409020546001600160581b031681565b6040516001600160581b039091168152602001610137565b6101b46102a9366004611de1565b5f908152600660205260409020546001600160a01b031690565b6101b46102d1366004611de1565b60066020525f90815260409020546001600160a01b031681565b6101b46102f9366004611de1565b610a31565b61030785610a58565b5f836001600160401b0381111561032057610320611f78565b604051908082528060200260200182016040528015610349578160200160208202803683370190505b5090505f846001600160401b0381111561036557610365611f78565b60405190808252806020026020018201604052801561038e578160200160208202803683370190505b5090505f805b8681101561057f575f8888838181106103af576103af611f8c565b9050602002013590506103c38a3383610a7c565b6103e857604051630e35d34560e11b8152600481018290526024015b60405180910390fd5b6040805160208082018d9052818301849052825180830384018152606090920183528151918101919091205f8181526007909252919020546001600160a01b03168061044a576040516349a0267360e11b8152600481018490526024016103df565b5f82815260076020908152604080832080546001600160a01b0319169055338352600882528083208f845282528083208684529091528120805460ff19169055610495888784610b28565b90505f1981036104fd57818887815181106104b2576104b2611f8c565b60200260200101906001600160a01b031690816001600160a01b03168152505060018787815181106104e6576104e6611f8c565b602002602001018181525050856001019550610522565b86818151811061050f5761050f611f8c565b6020026020010180516001019081815250505b8c826001600160a01b0316336001600160a01b03167f3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b408298028760405161056891815260200190565b60405180910390a450505050806001019050610394565b505f5b81811015610649575f84828151811061059d5761059d611f8c565b602002602001015190505f6105b3888884610b7f565b90505f1981036105e15760405163e0a76e8560e01b81526001600160a01b03831660048201526024016103df565b61063f828685815181106105f7576105f7611f8c565b602002602001015161060890611fb4565b8a8a8581811061061a5761061a611f8c565b905060200281019061062c9190611fce565b61063a906020810190611fec565b610be3565b5050600101610582565b50610652610e31565b5050505050505050565b6001600160a01b0381165f908152600560205260408120546001600160581b0316906106888383610e89565b9050915091565b6001600160a01b0381165f908152600560205260408120546106bb9083906001600160581b0316610e89565b92915050565b60606106cc84610a58565b5f805b83811015610744575f8585838181106106ea576106ea611f8c565b335f9081526008602090815260408083208d84528252808320938202959095013580835292905292909220549192505060ff16801561072f575061072f873383610a7c565b1561073b578260010192505b506001016106cf565b505f816001600160401b0381111561075e5761075e611f78565b604051908082528060200260200182016040528015610787578160200160208202803683370190505b5090505f805b85811015610826575f8787838181106107a8576107a8611f8c565b335f9081526008602090815260408083208f84528252808320938202959095013580835292905292909220549192505060ff1680156107ed57506107ed893383610a7c565b1561081d578084846107fe81612031565b95508151811061081057610810611f8c565b6020026020010181815250505b5060010161078d565b5090925050505b9392505050565b606061083f84610a58565b816001600160401b0381111561085757610857611f78565b604051908082528060200260200182016040528015610880578160200160208202803683370190505b5090505f5b8281101561092b5760075f6108d9878787868181106108a6576108a6611f8c565b90506020020135604080516020808201949094528082019290925280518083038201815260609092019052805191012090565b81526020019081526020015f205f9054906101000a90046001600160a01b031682828151811061090b5761090b611f8c565b6001600160a01b0390921660209283029190910190910152600101610885565b509392505050565b61093c87610a58565b6001600160a01b0388166109635760405163d92e233d60e01b815260040160405180910390fd5b5f5f5f5f6109738c8c8c8c610ea8565b9350935093509350805f0361099b5760405163fcea6b3560e01b815260040160405180910390fd5b6109a88484848989611200565b6109b48c828a8a610be3565b6109bc610e31565b505050505050505050505050565b6109d387610a58565b6001600160a01b0388166109fa5760405163d92e233d60e01b815260040160405180910390fd5b5f5f5f5f610a0a8c8c8c8c6112ac565b9350935093509350610a1f8484848b8b6115cc565b80156109bc576109b48c828888610be3565b5f8181548110610a3f575f80fd5b5f918252602090912001546001600160a01b0316905081565b5f548110610a795760405163517172a160e11b815260040160405180910390fd5b50565b5f5f5f8581548110610a9057610a90611f8c565b5f9182526020918290206040805193840181529101546001600160a01b0390811680845291516331a9108f60e11b815260048101879052929350861691636352211e90602401602060405180830381865afa158015610af1573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610b159190612049565b6001600160a01b03161495945050505050565b5f805b83811015610b7457826001600160a01b0316858281518110610b4f57610b4f611f8c565b60200260200101516001600160a01b031603610b6c57905061082d565b600101610b2b565b505f19949350505050565b5f805b83811015610b7457826001600160a01b0316858583818110610ba657610ba6611f8c565b9050602002810190610bb89190611fce565b610bc6906020810190611dc6565b6001600160a01b031603610bdb57905061082d565b600101610b82565b8215610e2b576001600160a01b0384165f908152600560205260408120546001600160581b03169080851315610c48576001600160581b03808316860190811115610c4157604051633643f37960e21b815260040160405180910390fd5b9050610c8c565b5f610c5286611fb4565b9050826001600160581b0316811115610c7e57604051637b1304a960e11b815260040160405180910390fd5b6001600160581b0383160390505b5f610c978784610e89565b90505f610ca48884610e89565b90505f5160206121c05f395f51905f5282101580610ccf57505f5160206121c05f395f51905f528110155b15610ced57604051633643f37960e21b815260040160405180910390fd5b6001600160581b038416158015610d0c57505f836001600160581b0316115b15610d5557610d1c60018261164d565b505f610d2960018361180c565b5f90815260066020526040902080546001600160a01b0319166001600160a01b038b1617905550610db1565b826001600160581b03165f03610da1575f610d7160018461180c565b9050610d806001848989611857565b505f90815260066020526040902080546001600160a01b0319169055610db1565b610daf60018383898961186e565b505b6001600160a01b0388165f8181526005602090815260409182902080546affffffffffffffffffffff19166001600160581b0388811691821790925583519189168252918101919091527fee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b910160405180910390a2505050505b50505050565b6002545f90815260036020908152604080832054808452600983529281902043908190558151908152905183927fac84e1f746682c16ccc7cac6060f24ba0d81b110e6dc4cfa95bbfae24a5fc07d928290030190a250565b6001600160581b031660589190911b600160581b600160f81b03161790565b6060805f80846001600160401b03811115610ec557610ec5611f78565b604051908082528060200260200182016040528015610eee578160200160208202803683370190505b509350846001600160401b03811115610f0957610f09611f78565b604051908082528060200260200182016040528015610f32578160200160208202803683370190505b5092505f5b858110156111f4575f878783818110610f5257610f52611f8c565b60200291909101359150610f639050565b610f6e893383610a7c565b610f8e57604051630e35d34560e11b8152600481018290526024016103df565b6040805160208082018c9052818301849052825180830384018152606090920183528151918101919091205f8181526007909252919020546001600160a01b0316801561110457335f9081526008602090815260408083208e8452825280832086845290915290205460ff161561101b5760405163391fac8f60e21b8152600481018490526024016103df565b5f611027898884610b28565b90505f19810361108f578189888151811061104457611044611f8c565b60200260200101906001600160a01b031690816001600160a01b031681525050600188888151811061107857611078611f8c565b6020026020010181815250508660010196506110b4565b8781815181106110a1576110a1611f8c565b6020026020010180516001019081815250505b8b826001600160a01b0316336001600160a01b03167f3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802876040516110fa91815260200190565b60405180910390a4505b8b60075f8481526020019081526020015f205f6101000a8154816001600160a01b0302191690836001600160a01b03160217905550600160085f336001600160a01b03166001600160a01b031681526020019081526020015f205f8d81526020019081526020015f205f8581526020019081526020015f205f6101000a81548160ff0219169083151502179055508460010194508a8c6001600160a01b0316336001600160a01b03167f24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04866040516111de91815260200190565b60405180910390a4505050806001019050610f37565b50945094509450949050565b5f5b838110156112a4575f86828151811061121d5761121d611f8c565b602002602001015190505f611233858584610b7f565b90505f1981036112615760405163e0a76e8560e01b81526001600160a01b03831660048201526024016103df565b61129a8288858151811061127757611277611f8c565b602002602001015161128890611fb4565b87878581811061061a5761061a611f8c565b5050600101611202565b505050505050565b6060805f80846001600160401b038111156112c9576112c9611f78565b6040519080825280602002602001820160405280156112f2578160200160208202803683370190505b509350846001600160401b0381111561130d5761130d611f78565b604051908082528060200260200182016040528015611336578160200160208202803683370190505b5092505f5b858110156111f4575f87878381811061135657611356611f8c565b602002919091013591506113679050565b611372893383610a7c565b61139257604051630e35d34560e11b8152600481018290526024016103df565b6040805160208082018c9052818301849052825180830384018152606090920183528151918101919091205f8181526007909252919020546001600160a01b03908116908c1681036113e6575050506115c4565b6001600160a01b038116156114de575f611401898884610b28565b90505f198103611469578189888151811061141e5761141e611f8c565b60200260200101906001600160a01b031690816001600160a01b031681525050600188888151811061145257611452611f8c565b60200260200101818152505086600101965061148e565b87818151811061147b5761147b611f8c565b6020026020010180516001019081815250505b8b826001600160a01b0316336001600160a01b03167f3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802876040516114d491815260200190565b60405180910390a4505b8b60075f8481526020019081526020015f205f6101000a8154816001600160a01b0302191690836001600160a01b03160217905550600160085f336001600160a01b03166001600160a01b031681526020019081526020015f205f8d81526020019081526020015f205f8581526020019081526020015f205f6101000a81548160ff0219169083151502179055508460010194508a8c6001600160a01b0316336001600160a01b03167f24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04866040516115b891815260200190565b60405180910390a45050505b60010161133b565b5f5b838110156112a4575f8682815181106115e9576115e9611f8c565b602002602001015190505f6115ff858584610b7f565b90505f19810361162d5760405163e0a76e8560e01b81526001600160a01b03831660048201526024016103df565b6116438288858151811061127757611277611f8c565b50506001016115ce565b5f5f5160206121c05f395f51905f52821061167b576040516361c0541760e11b815260040160405180910390fd5b815f0361169b576040516314b48df160e11b815260040160405180910390fd5b5f828152600384016020526040902054156116c9576040516312c50cad60e11b815260040160405180910390fd5b8254600180850154906116dd908390612064565b6116e882600261215a565b10156116fa576116f781612031565b90505b60018501819055835f5b828110156117d2578084901c6001166001036117b7576040805180820182525f83815260028a0160209081529083902054825281018490529051632b0aac7f60e11b815273__$a2daaad8940c9006af3f1557205ebe532d$__9163561558fe916117719190600401612165565b602060405180830381865af415801561178c573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117b09190612195565b91506117ca565b5f81815260028801602052604090208290555b600101611704565b506117dc83612031565b8087555f928352600287016020908152604080852084905596845260039097019096529390209390935550919050565b5f818152600383016020526040812054810361183b57604051631c811d5b60e21b815260040160405180910390fd5b5f82815260038401602052604090205461082d906001906121ac565b5f61186585855f868661186e565b95945050505050565b5f5f5160206121c05f395f51905f52841061189c576040516361c0541760e11b815260040160405180910390fd5b5f8581526003870160205260409020546118c957604051631c811d5b60e21b815260040160405180910390fd5b5f848152600387016020526040902054156118f7576040516312c50cad60e11b815260040160405180910390fd5b5f611902878761180c565b8754909150859087905f90611919906001906121ac565b60018b01549091505f90815b81811015611c6f578087901c600116600103611ad3575f5160206121c05f395f51905f528a8a8581811061195b5761195b611f8c565b9050602002013510611980576040516361c0541760e11b815260040160405180910390fd5b73__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808d8d888181106119b7576119b7611f8c565b905060200201358152602001898152506040518263ffffffff1660e01b81526004016119e39190612165565b602060405180830381865af41580156119fe573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611a229190612195565b955073__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808d8d88818110611a5b57611a5b611f8c565b905060200201358152602001888152506040518263ffffffff1660e01b8152600401611a879190612165565b602060405180830381865af4158015611aa2573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611ac69190612195565b9450826001019250611c67565b86811c84821c14611c54575f5160206121c05f395f51905f528a8a85818110611afe57611afe611f8c565b9050602002013510611b23576040516361c0541760e11b815260040160405180910390fd5b5f81815260028e016020526040902054859003611b4d575f81815260028e01602052604090208690555b73__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808981526020018d8d88818110611b8a57611b8a611f8c565b905060200201358152506040518263ffffffff1660e01b8152600401611bb09190612165565b602060405180830381865af4158015611bcb573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611bef9190612195565b955073__$a2daaad8940c9006af3f1557205ebe532d$__63561558fe60405180604001604052808881526020018d8d88818110611c2e57611c2e611f8c565b905060200201358152506040518263ffffffff1660e01b8152600401611a879190612165565b5f81815260028e01602052604090208690555b600101611925565b5060018c01545f90815260028d0160205260409020548414611ca457604051631fd4986360e11b815260040160405180910390fd5b5f81815260028d01602052604090208590558915611cd4575f8b815260038d016020526040808220548c83529120555b5050505f88815260038a0160205260408120555091505095945050505050565b5f5f83601f840112611d04575f5ffd5b5081356001600160401b03811115611d1a575f5ffd5b6020830191508360208260051b8501011115611d34575f5ffd5b9250929050565b5f5f5f5f5f60608688031215611d4f575f5ffd5b8535945060208601356001600160401b03811115611d6b575f5ffd5b611d7788828901611cf4565b90955093505060408601356001600160401b03811115611d95575f5ffd5b611da188828901611cf4565b969995985093965092949392505050565b6001600160a01b0381168114610a79575f5ffd5b5f60208284031215611dd6575f5ffd5b813561082d81611db2565b5f60208284031215611df1575f5ffd5b5035919050565b5f5f5f60408486031215611e0a575f5ffd5b8335925060208401356001600160401b03811115611e26575f5ffd5b611e3286828701611cf4565b9497909650939450505050565b602080825282518282018190525f918401906040840190835b81811015611e76578351835260209384019390920191600101611e58565b509095945050505050565b602080825282518282018190525f918401906040840190835b81811015611e765783516001600160a01b0316835260209384019390920191600101611e9a565b5f5f5f5f5f5f5f5f60a0898b031215611ed8575f5ffd5b8835611ee381611db2565b97506020890135965060408901356001600160401b03811115611f04575f5ffd5b611f108b828c01611cf4565b90975095505060608901356001600160401b03811115611f2e575f5ffd5b611f3a8b828c01611cf4565b90955093505060808901356001600160401b03811115611f58575f5ffd5b611f648b828c01611cf4565b999c989b5096995094979396929594505050565b634e487b7160e01b5f52604160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b5f600160ff1b8201611fc857611fc8611fa0565b505f0390565b5f8235603e19833603018112611fe2575f5ffd5b9190910192915050565b5f5f8335601e19843603018112612001575f5ffd5b8301803591506001600160401b0382111561201a575f5ffd5b6020019150600581901b3603821315611d34575f5ffd5b5f6001820161204257612042611fa0565b5060010190565b5f60208284031215612059575f5ffd5b815161082d81611db2565b808201808211156106bb576106bb611fa0565b6001815b60018411156120b25780850481111561209657612096611fa0565b60018416156120a457908102905b60019390931c92800261207b565b935093915050565b5f826120c8575060016106bb565b816120d457505f6106bb565b81600181146120ea57600281146120f457612110565b60019150506106bb565b60ff84111561210557612105611fa0565b50506001821b6106bb565b5060208310610133831016604e8410600b8410161715612133575081810a6106bb565b61213f5f198484612077565b805f190482111561215257612152611fa0565b029392505050565b5f61082d83836120ba565b6040810181835f5b600281101561218c57815183526020928301929091019060010161216d565b50505092915050565b5f602082840312156121a5575f5ffd5b5051919050565b818103818111156106bb576106bb611fa056fe30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001a26469706673582212205704b54aa2f3a6d833bdded38c45c71fd8b525f142cd88491509286aae475f9d64736f6c634300081e0033",
}

// DavinciDaoABI is the input ABI used to generate the binding from.
// Deprecated: Use DavinciDaoMetaData.ABI instead.
var DavinciDaoABI = DavinciDaoMetaData.ABI

// DavinciDaoBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use DavinciDaoMetaData.Bin instead.
var DavinciDaoBin = DavinciDaoMetaData.Bin

// DeployDavinciDao deploys a new Ethereum contract, binding an instance of DavinciDao to it.
func DeployDavinciDao(auth *bind.TransactOpts, backend bind.ContractBackend, tokens []common.Address) (common.Address, *types.Transaction, *DavinciDao, error) {
	parsed, err := DavinciDaoMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(DavinciDaoBin), backend, tokens)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &DavinciDao{DavinciDaoCaller: DavinciDaoCaller{contract: contract}, DavinciDaoTransactor: DavinciDaoTransactor{contract: contract}, DavinciDaoFilterer: DavinciDaoFilterer{contract: contract}}, nil
}

// DavinciDao is an auto generated Go binding around an Ethereum contract.
type DavinciDao struct {
	DavinciDaoCaller     // Read-only binding to the contract
	DavinciDaoTransactor // Write-only binding to the contract
	DavinciDaoFilterer   // Log filterer for contract events
}

// DavinciDaoCaller is an auto generated read-only Go binding around an Ethereum contract.
type DavinciDaoCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DavinciDaoTransactor is an auto generated write-only Go binding around an Ethereum contract.
type DavinciDaoTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DavinciDaoFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type DavinciDaoFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DavinciDaoSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type DavinciDaoSession struct {
	Contract     *DavinciDao       // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// DavinciDaoCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type DavinciDaoCallerSession struct {
	Contract *DavinciDaoCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts     // Call options to use throughout this session
}

// DavinciDaoTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type DavinciDaoTransactorSession struct {
	Contract     *DavinciDaoTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// DavinciDaoRaw is an auto generated low-level Go binding around an Ethereum contract.
type DavinciDaoRaw struct {
	Contract *DavinciDao // Generic contract binding to access the raw methods on
}

// DavinciDaoCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type DavinciDaoCallerRaw struct {
	Contract *DavinciDaoCaller // Generic read-only contract binding to access the raw methods on
}

// DavinciDaoTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type DavinciDaoTransactorRaw struct {
	Contract *DavinciDaoTransactor // Generic write-only contract binding to access the raw methods on
}

// NewDavinciDao creates a new instance of DavinciDao, bound to a specific deployed contract.
func NewDavinciDao(address common.Address, backend bind.ContractBackend) (*DavinciDao, error) {
	contract, err := bindDavinciDao(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &DavinciDao{DavinciDaoCaller: DavinciDaoCaller{contract: contract}, DavinciDaoTransactor: DavinciDaoTransactor{contract: contract}, DavinciDaoFilterer: DavinciDaoFilterer{contract: contract}}, nil
}

// NewDavinciDaoCaller creates a new read-only instance of DavinciDao, bound to a specific deployed contract.
func NewDavinciDaoCaller(address common.Address, caller bind.ContractCaller) (*DavinciDaoCaller, error) {
	contract, err := bindDavinciDao(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCaller{contract: contract}, nil
}

// NewDavinciDaoTransactor creates a new write-only instance of DavinciDao, bound to a specific deployed contract.
func NewDavinciDaoTransactor(address common.Address, transactor bind.ContractTransactor) (*DavinciDaoTransactor, error) {
	contract, err := bindDavinciDao(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoTransactor{contract: contract}, nil
}

// NewDavinciDaoFilterer creates a new log filterer instance of DavinciDao, bound to a specific deployed contract.
func NewDavinciDaoFilterer(address common.Address, filterer bind.ContractFilterer) (*DavinciDaoFilterer, error) {
	contract, err := bindDavinciDao(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoFilterer{contract: contract}, nil
}

// bindDavinciDao binds a generic wrapper to an already deployed contract.
func bindDavinciDao(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := DavinciDaoMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DavinciDao *DavinciDaoRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DavinciDao.Contract.DavinciDaoCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DavinciDao *DavinciDaoRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DavinciDao.Contract.DavinciDaoTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DavinciDao *DavinciDaoRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DavinciDao.Contract.DavinciDaoTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DavinciDao *DavinciDaoCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DavinciDao.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DavinciDao *DavinciDaoTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DavinciDao.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DavinciDao *DavinciDaoTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DavinciDao.Contract.contract.Transact(opts, method, params...)
}

// Collections is a free data retrieval call binding the contract method 0xfdbda0ec.
//
// Solidity: function collections(uint256 ) view returns(address token)
func (_DavinciDao *DavinciDaoCaller) Collections(opts *bind.CallOpts, arg0 *big.Int) (common.Address, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "collections", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Collections is a free data retrieval call binding the contract method 0xfdbda0ec.
//
// Solidity: function collections(uint256 ) view returns(address token)
func (_DavinciDao *DavinciDaoSession) Collections(arg0 *big.Int) (common.Address, error) {
	return _DavinciDao.Contract.Collections(&_DavinciDao.CallOpts, arg0)
}

// Collections is a free data retrieval call binding the contract method 0xfdbda0ec.
//
// Solidity: function collections(uint256 ) view returns(address token)
func (_DavinciDao *DavinciDaoCallerSession) Collections(arg0 *big.Int) (common.Address, error) {
	return _DavinciDao.Contract.Collections(&_DavinciDao.CallOpts, arg0)
}

// ComputeLeaf is a free data retrieval call binding the contract method 0x7b6c7c71.
//
// Solidity: function computeLeaf(address account) view returns(uint256)
func (_DavinciDao *DavinciDaoCaller) ComputeLeaf(opts *bind.CallOpts, account common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "computeLeaf", account)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// ComputeLeaf is a free data retrieval call binding the contract method 0x7b6c7c71.
//
// Solidity: function computeLeaf(address account) view returns(uint256)
func (_DavinciDao *DavinciDaoSession) ComputeLeaf(account common.Address) (*big.Int, error) {
	return _DavinciDao.Contract.ComputeLeaf(&_DavinciDao.CallOpts, account)
}

// ComputeLeaf is a free data retrieval call binding the contract method 0x7b6c7c71.
//
// Solidity: function computeLeaf(address account) view returns(uint256)
func (_DavinciDao *DavinciDaoCallerSession) ComputeLeaf(account common.Address) (*big.Int, error) {
	return _DavinciDao.Contract.ComputeLeaf(&_DavinciDao.CallOpts, account)
}

// GetAccountAt is a free data retrieval call binding the contract method 0xf157c0ac.
//
// Solidity: function getAccountAt(uint256 index) view returns(address)
func (_DavinciDao *DavinciDaoCaller) GetAccountAt(opts *bind.CallOpts, index *big.Int) (common.Address, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "getAccountAt", index)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetAccountAt is a free data retrieval call binding the contract method 0xf157c0ac.
//
// Solidity: function getAccountAt(uint256 index) view returns(address)
func (_DavinciDao *DavinciDaoSession) GetAccountAt(index *big.Int) (common.Address, error) {
	return _DavinciDao.Contract.GetAccountAt(&_DavinciDao.CallOpts, index)
}

// GetAccountAt is a free data retrieval call binding the contract method 0xf157c0ac.
//
// Solidity: function getAccountAt(uint256 index) view returns(address)
func (_DavinciDao *DavinciDaoCallerSession) GetAccountAt(index *big.Int) (common.Address, error) {
	return _DavinciDao.Contract.GetAccountAt(&_DavinciDao.CallOpts, index)
}

// GetCensusRoot is a free data retrieval call binding the contract method 0xc1da8691.
//
// Solidity: function getCensusRoot() view returns(uint256)
func (_DavinciDao *DavinciDaoCaller) GetCensusRoot(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "getCensusRoot")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetCensusRoot is a free data retrieval call binding the contract method 0xc1da8691.
//
// Solidity: function getCensusRoot() view returns(uint256)
func (_DavinciDao *DavinciDaoSession) GetCensusRoot() (*big.Int, error) {
	return _DavinciDao.Contract.GetCensusRoot(&_DavinciDao.CallOpts)
}

// GetCensusRoot is a free data retrieval call binding the contract method 0xc1da8691.
//
// Solidity: function getCensusRoot() view returns(uint256)
func (_DavinciDao *DavinciDaoCallerSession) GetCensusRoot() (*big.Int, error) {
	return _DavinciDao.Contract.GetCensusRoot(&_DavinciDao.CallOpts)
}

// GetDelegations is a free data retrieval call binding the contract method 0x31cc13ba.
//
// Solidity: function getDelegations(address account) view returns(uint88 weight, uint256 leaf)
func (_DavinciDao *DavinciDaoCaller) GetDelegations(opts *bind.CallOpts, account common.Address) (struct {
	Weight *big.Int
	Leaf   *big.Int
}, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "getDelegations", account)

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
func (_DavinciDao *DavinciDaoSession) GetDelegations(account common.Address) (struct {
	Weight *big.Int
	Leaf   *big.Int
}, error) {
	return _DavinciDao.Contract.GetDelegations(&_DavinciDao.CallOpts, account)
}

// GetDelegations is a free data retrieval call binding the contract method 0x31cc13ba.
//
// Solidity: function getDelegations(address account) view returns(uint88 weight, uint256 leaf)
func (_DavinciDao *DavinciDaoCallerSession) GetDelegations(account common.Address) (struct {
	Weight *big.Int
	Leaf   *big.Int
}, error) {
	return _DavinciDao.Contract.GetDelegations(&_DavinciDao.CallOpts, account)
}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[])
func (_DavinciDao *DavinciDaoCaller) GetNFTids(opts *bind.CallOpts, nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "getNFTids", nftIndex, candidateIds)

	if err != nil {
		return *new([]*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new([]*big.Int)).(*[]*big.Int)

	return out0, err

}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[])
func (_DavinciDao *DavinciDaoSession) GetNFTids(nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	return _DavinciDao.Contract.GetNFTids(&_DavinciDao.CallOpts, nftIndex, candidateIds)
}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[])
func (_DavinciDao *DavinciDaoCallerSession) GetNFTids(nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	return _DavinciDao.Contract.GetNFTids(&_DavinciDao.CallOpts, nftIndex, candidateIds)
}

// GetRootBlockNumber is a free data retrieval call binding the contract method 0x650e5fcf.
//
// Solidity: function getRootBlockNumber(uint256 root) view returns(uint256)
func (_DavinciDao *DavinciDaoCaller) GetRootBlockNumber(opts *bind.CallOpts, root *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "getRootBlockNumber", root)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetRootBlockNumber is a free data retrieval call binding the contract method 0x650e5fcf.
//
// Solidity: function getRootBlockNumber(uint256 root) view returns(uint256)
func (_DavinciDao *DavinciDaoSession) GetRootBlockNumber(root *big.Int) (*big.Int, error) {
	return _DavinciDao.Contract.GetRootBlockNumber(&_DavinciDao.CallOpts, root)
}

// GetRootBlockNumber is a free data retrieval call binding the contract method 0x650e5fcf.
//
// Solidity: function getRootBlockNumber(uint256 root) view returns(uint256)
func (_DavinciDao *DavinciDaoCallerSession) GetRootBlockNumber(root *big.Int) (*big.Int, error) {
	return _DavinciDao.Contract.GetRootBlockNumber(&_DavinciDao.CallOpts, root)
}

// GetTokenDelegations is a free data retrieval call binding the contract method 0xc333b0f1.
//
// Solidity: function getTokenDelegations(uint256 nftIndex, uint256[] ids) view returns(address[] delegates)
func (_DavinciDao *DavinciDaoCaller) GetTokenDelegations(opts *bind.CallOpts, nftIndex *big.Int, ids []*big.Int) ([]common.Address, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "getTokenDelegations", nftIndex, ids)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetTokenDelegations is a free data retrieval call binding the contract method 0xc333b0f1.
//
// Solidity: function getTokenDelegations(uint256 nftIndex, uint256[] ids) view returns(address[] delegates)
func (_DavinciDao *DavinciDaoSession) GetTokenDelegations(nftIndex *big.Int, ids []*big.Int) ([]common.Address, error) {
	return _DavinciDao.Contract.GetTokenDelegations(&_DavinciDao.CallOpts, nftIndex, ids)
}

// GetTokenDelegations is a free data retrieval call binding the contract method 0xc333b0f1.
//
// Solidity: function getTokenDelegations(uint256 nftIndex, uint256[] ids) view returns(address[] delegates)
func (_DavinciDao *DavinciDaoCallerSession) GetTokenDelegations(nftIndex *big.Int, ids []*big.Int) ([]common.Address, error) {
	return _DavinciDao.Contract.GetTokenDelegations(&_DavinciDao.CallOpts, nftIndex, ids)
}

// IndexAccount is a free data retrieval call binding the contract method 0xf8fee8ed.
//
// Solidity: function indexAccount(uint256 ) view returns(address)
func (_DavinciDao *DavinciDaoCaller) IndexAccount(opts *bind.CallOpts, arg0 *big.Int) (common.Address, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "indexAccount", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// IndexAccount is a free data retrieval call binding the contract method 0xf8fee8ed.
//
// Solidity: function indexAccount(uint256 ) view returns(address)
func (_DavinciDao *DavinciDaoSession) IndexAccount(arg0 *big.Int) (common.Address, error) {
	return _DavinciDao.Contract.IndexAccount(&_DavinciDao.CallOpts, arg0)
}

// IndexAccount is a free data retrieval call binding the contract method 0xf8fee8ed.
//
// Solidity: function indexAccount(uint256 ) view returns(address)
func (_DavinciDao *DavinciDaoCallerSession) IndexAccount(arg0 *big.Int) (common.Address, error) {
	return _DavinciDao.Contract.IndexAccount(&_DavinciDao.CallOpts, arg0)
}

// RootBlockNumbers is a free data retrieval call binding the contract method 0x41a38282.
//
// Solidity: function rootBlockNumbers(uint256 ) view returns(uint256)
func (_DavinciDao *DavinciDaoCaller) RootBlockNumbers(opts *bind.CallOpts, arg0 *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "rootBlockNumbers", arg0)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// RootBlockNumbers is a free data retrieval call binding the contract method 0x41a38282.
//
// Solidity: function rootBlockNumbers(uint256 ) view returns(uint256)
func (_DavinciDao *DavinciDaoSession) RootBlockNumbers(arg0 *big.Int) (*big.Int, error) {
	return _DavinciDao.Contract.RootBlockNumbers(&_DavinciDao.CallOpts, arg0)
}

// RootBlockNumbers is a free data retrieval call binding the contract method 0x41a38282.
//
// Solidity: function rootBlockNumbers(uint256 ) view returns(uint256)
func (_DavinciDao *DavinciDaoCallerSession) RootBlockNumbers(arg0 *big.Int) (*big.Int, error) {
	return _DavinciDao.Contract.RootBlockNumbers(&_DavinciDao.CallOpts, arg0)
}

// TokenDelegate is a free data retrieval call binding the contract method 0x66e12bef.
//
// Solidity: function tokenDelegate(bytes32 ) view returns(address)
func (_DavinciDao *DavinciDaoCaller) TokenDelegate(opts *bind.CallOpts, arg0 [32]byte) (common.Address, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "tokenDelegate", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// TokenDelegate is a free data retrieval call binding the contract method 0x66e12bef.
//
// Solidity: function tokenDelegate(bytes32 ) view returns(address)
func (_DavinciDao *DavinciDaoSession) TokenDelegate(arg0 [32]byte) (common.Address, error) {
	return _DavinciDao.Contract.TokenDelegate(&_DavinciDao.CallOpts, arg0)
}

// TokenDelegate is a free data retrieval call binding the contract method 0x66e12bef.
//
// Solidity: function tokenDelegate(bytes32 ) view returns(address)
func (_DavinciDao *DavinciDaoCallerSession) TokenDelegate(arg0 [32]byte) (common.Address, error) {
	return _DavinciDao.Contract.TokenDelegate(&_DavinciDao.CallOpts, arg0)
}

// WeightOf is a free data retrieval call binding the contract method 0xdd4bc101.
//
// Solidity: function weightOf(address ) view returns(uint88)
func (_DavinciDao *DavinciDaoCaller) WeightOf(opts *bind.CallOpts, arg0 common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "weightOf", arg0)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// WeightOf is a free data retrieval call binding the contract method 0xdd4bc101.
//
// Solidity: function weightOf(address ) view returns(uint88)
func (_DavinciDao *DavinciDaoSession) WeightOf(arg0 common.Address) (*big.Int, error) {
	return _DavinciDao.Contract.WeightOf(&_DavinciDao.CallOpts, arg0)
}

// WeightOf is a free data retrieval call binding the contract method 0xdd4bc101.
//
// Solidity: function weightOf(address ) view returns(uint88)
func (_DavinciDao *DavinciDaoCallerSession) WeightOf(arg0 common.Address) (*big.Int, error) {
	return _DavinciDao.Contract.WeightOf(&_DavinciDao.CallOpts, arg0)
}

// Delegate is a paid mutator transaction binding the contract method 0xd0424d7c.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, (address,uint256[])[] fromProofs) returns()
func (_DavinciDao *DavinciDaoTransactor) Delegate(opts *bind.TransactOpts, to common.Address, nftIndex *big.Int, ids []*big.Int, toProof []*big.Int, fromProofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.contract.Transact(opts, "delegate", to, nftIndex, ids, toProof, fromProofs)
}

// Delegate is a paid mutator transaction binding the contract method 0xd0424d7c.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, (address,uint256[])[] fromProofs) returns()
func (_DavinciDao *DavinciDaoSession) Delegate(to common.Address, nftIndex *big.Int, ids []*big.Int, toProof []*big.Int, fromProofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.Contract.Delegate(&_DavinciDao.TransactOpts, to, nftIndex, ids, toProof, fromProofs)
}

// Delegate is a paid mutator transaction binding the contract method 0xd0424d7c.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, (address,uint256[])[] fromProofs) returns()
func (_DavinciDao *DavinciDaoTransactorSession) Delegate(to common.Address, nftIndex *big.Int, ids []*big.Int, toProof []*big.Int, fromProofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.Contract.Delegate(&_DavinciDao.TransactOpts, to, nftIndex, ids, toProof, fromProofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0x1b1db502.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint256[])[] proofs) returns()
func (_DavinciDao *DavinciDaoTransactor) Undelegate(opts *bind.TransactOpts, nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.contract.Transact(opts, "undelegate", nftIndex, ids, proofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0x1b1db502.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint256[])[] proofs) returns()
func (_DavinciDao *DavinciDaoSession) Undelegate(nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.Contract.Undelegate(&_DavinciDao.TransactOpts, nftIndex, ids, proofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0x1b1db502.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint256[])[] proofs) returns()
func (_DavinciDao *DavinciDaoTransactorSession) Undelegate(nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.Contract.Undelegate(&_DavinciDao.TransactOpts, nftIndex, ids, proofs)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0xd4d10661.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, (address,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoTransactor) UpdateDelegation(opts *bind.TransactOpts, to common.Address, nftIndex *big.Int, ids []*big.Int, fromProofs []DavinciDaoProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.contract.Transact(opts, "updateDelegation", to, nftIndex, ids, fromProofs, toProof)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0xd4d10661.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, (address,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoSession) UpdateDelegation(to common.Address, nftIndex *big.Int, ids []*big.Int, fromProofs []DavinciDaoProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.Contract.UpdateDelegation(&_DavinciDao.TransactOpts, to, nftIndex, ids, fromProofs, toProof)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0xd4d10661.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, (address,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoTransactorSession) UpdateDelegation(to common.Address, nftIndex *big.Int, ids []*big.Int, fromProofs []DavinciDaoProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.Contract.UpdateDelegation(&_DavinciDao.TransactOpts, to, nftIndex, ids, fromProofs, toProof)
}

// DavinciDaoCensusRootUpdatedIterator is returned from FilterCensusRootUpdated and is used to iterate over the raw logs and unpacked data for CensusRootUpdated events raised by the DavinciDao contract.
type DavinciDaoCensusRootUpdatedIterator struct {
	Event *DavinciDaoCensusRootUpdated // Event containing the contract specifics and raw log

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
func (it *DavinciDaoCensusRootUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoCensusRootUpdated)
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
		it.Event = new(DavinciDaoCensusRootUpdated)
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
func (it *DavinciDaoCensusRootUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoCensusRootUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoCensusRootUpdated represents a CensusRootUpdated event raised by the DavinciDao contract.
type DavinciDaoCensusRootUpdated struct {
	NewRoot     *big.Int
	BlockNumber *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterCensusRootUpdated is a free log retrieval operation binding the contract event 0xac84e1f746682c16ccc7cac6060f24ba0d81b110e6dc4cfa95bbfae24a5fc07d.
//
// Solidity: event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber)
func (_DavinciDao *DavinciDaoFilterer) FilterCensusRootUpdated(opts *bind.FilterOpts, newRoot []*big.Int) (*DavinciDaoCensusRootUpdatedIterator, error) {

	var newRootRule []interface{}
	for _, newRootItem := range newRoot {
		newRootRule = append(newRootRule, newRootItem)
	}

	logs, sub, err := _DavinciDao.contract.FilterLogs(opts, "CensusRootUpdated", newRootRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoCensusRootUpdatedIterator{contract: _DavinciDao.contract, event: "CensusRootUpdated", logs: logs, sub: sub}, nil
}

// WatchCensusRootUpdated is a free log subscription operation binding the contract event 0xac84e1f746682c16ccc7cac6060f24ba0d81b110e6dc4cfa95bbfae24a5fc07d.
//
// Solidity: event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber)
func (_DavinciDao *DavinciDaoFilterer) WatchCensusRootUpdated(opts *bind.WatchOpts, sink chan<- *DavinciDaoCensusRootUpdated, newRoot []*big.Int) (event.Subscription, error) {

	var newRootRule []interface{}
	for _, newRootItem := range newRoot {
		newRootRule = append(newRootRule, newRootItem)
	}

	logs, sub, err := _DavinciDao.contract.WatchLogs(opts, "CensusRootUpdated", newRootRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoCensusRootUpdated)
				if err := _DavinciDao.contract.UnpackLog(event, "CensusRootUpdated", log); err != nil {
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

// ParseCensusRootUpdated is a log parse operation binding the contract event 0xac84e1f746682c16ccc7cac6060f24ba0d81b110e6dc4cfa95bbfae24a5fc07d.
//
// Solidity: event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber)
func (_DavinciDao *DavinciDaoFilterer) ParseCensusRootUpdated(log types.Log) (*DavinciDaoCensusRootUpdated, error) {
	event := new(DavinciDaoCensusRootUpdated)
	if err := _DavinciDao.contract.UnpackLog(event, "CensusRootUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DavinciDaoDelegatedIterator is returned from FilterDelegated and is used to iterate over the raw logs and unpacked data for Delegated events raised by the DavinciDao contract.
type DavinciDaoDelegatedIterator struct {
	Event *DavinciDaoDelegated // Event containing the contract specifics and raw log

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
func (it *DavinciDaoDelegatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoDelegated)
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
		it.Event = new(DavinciDaoDelegated)
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
func (it *DavinciDaoDelegatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoDelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoDelegated represents a Delegated event raised by the DavinciDao contract.
type DavinciDaoDelegated struct {
	Owner    common.Address
	To       common.Address
	NftIndex *big.Int
	TokenId  *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterDelegated is a free log retrieval operation binding the contract event 0x24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04.
//
// Solidity: event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDao *DavinciDaoFilterer) FilterDelegated(opts *bind.FilterOpts, owner []common.Address, to []common.Address, nftIndex []*big.Int) (*DavinciDaoDelegatedIterator, error) {

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

	logs, sub, err := _DavinciDao.contract.FilterLogs(opts, "Delegated", ownerRule, toRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoDelegatedIterator{contract: _DavinciDao.contract, event: "Delegated", logs: logs, sub: sub}, nil
}

// WatchDelegated is a free log subscription operation binding the contract event 0x24d7bda8602b916d64417f0dbfe2e2e88ec9b1157bd9f596dfdb91ba26624e04.
//
// Solidity: event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDao *DavinciDaoFilterer) WatchDelegated(opts *bind.WatchOpts, sink chan<- *DavinciDaoDelegated, owner []common.Address, to []common.Address, nftIndex []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DavinciDao.contract.WatchLogs(opts, "Delegated", ownerRule, toRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoDelegated)
				if err := _DavinciDao.contract.UnpackLog(event, "Delegated", log); err != nil {
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
func (_DavinciDao *DavinciDaoFilterer) ParseDelegated(log types.Log) (*DavinciDaoDelegated, error) {
	event := new(DavinciDaoDelegated)
	if err := _DavinciDao.contract.UnpackLog(event, "Delegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DavinciDaoUndelegatedIterator is returned from FilterUndelegated and is used to iterate over the raw logs and unpacked data for Undelegated events raised by the DavinciDao contract.
type DavinciDaoUndelegatedIterator struct {
	Event *DavinciDaoUndelegated // Event containing the contract specifics and raw log

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
func (it *DavinciDaoUndelegatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoUndelegated)
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
		it.Event = new(DavinciDaoUndelegated)
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
func (it *DavinciDaoUndelegatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoUndelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoUndelegated represents a Undelegated event raised by the DavinciDao contract.
type DavinciDaoUndelegated struct {
	Owner    common.Address
	From     common.Address
	NftIndex *big.Int
	TokenId  *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterUndelegated is a free log retrieval operation binding the contract event 0x3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802.
//
// Solidity: event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDao *DavinciDaoFilterer) FilterUndelegated(opts *bind.FilterOpts, owner []common.Address, from []common.Address, nftIndex []*big.Int) (*DavinciDaoUndelegatedIterator, error) {

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

	logs, sub, err := _DavinciDao.contract.FilterLogs(opts, "Undelegated", ownerRule, fromRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoUndelegatedIterator{contract: _DavinciDao.contract, event: "Undelegated", logs: logs, sub: sub}, nil
}

// WatchUndelegated is a free log subscription operation binding the contract event 0x3aace7340547de7b9156593a7652dc07ee900cea3fd8f82cb6c9d38b40829802.
//
// Solidity: event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId)
func (_DavinciDao *DavinciDaoFilterer) WatchUndelegated(opts *bind.WatchOpts, sink chan<- *DavinciDaoUndelegated, owner []common.Address, from []common.Address, nftIndex []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DavinciDao.contract.WatchLogs(opts, "Undelegated", ownerRule, fromRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoUndelegated)
				if err := _DavinciDao.contract.UnpackLog(event, "Undelegated", log); err != nil {
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
func (_DavinciDao *DavinciDaoFilterer) ParseUndelegated(log types.Log) (*DavinciDaoUndelegated, error) {
	event := new(DavinciDaoUndelegated)
	if err := _DavinciDao.contract.UnpackLog(event, "Undelegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DavinciDaoWeightChangedIterator is returned from FilterWeightChanged and is used to iterate over the raw logs and unpacked data for WeightChanged events raised by the DavinciDao contract.
type DavinciDaoWeightChangedIterator struct {
	Event *DavinciDaoWeightChanged // Event containing the contract specifics and raw log

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
func (it *DavinciDaoWeightChangedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoWeightChanged)
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
		it.Event = new(DavinciDaoWeightChanged)
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
func (it *DavinciDaoWeightChangedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoWeightChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoWeightChanged represents a WeightChanged event raised by the DavinciDao contract.
type DavinciDaoWeightChanged struct {
	Account        common.Address
	PreviousWeight *big.Int
	NewWeight      *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterWeightChanged is a free log retrieval operation binding the contract event 0xee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b.
//
// Solidity: event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight)
func (_DavinciDao *DavinciDaoFilterer) FilterWeightChanged(opts *bind.FilterOpts, account []common.Address) (*DavinciDaoWeightChangedIterator, error) {

	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}

	logs, sub, err := _DavinciDao.contract.FilterLogs(opts, "WeightChanged", accountRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoWeightChangedIterator{contract: _DavinciDao.contract, event: "WeightChanged", logs: logs, sub: sub}, nil
}

// WatchWeightChanged is a free log subscription operation binding the contract event 0xee82339564ef9f72eccdbb67b46a62198422524ab9c7e3fcbdd194fa1b46461b.
//
// Solidity: event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight)
func (_DavinciDao *DavinciDaoFilterer) WatchWeightChanged(opts *bind.WatchOpts, sink chan<- *DavinciDaoWeightChanged, account []common.Address) (event.Subscription, error) {

	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}

	logs, sub, err := _DavinciDao.contract.WatchLogs(opts, "WeightChanged", accountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoWeightChanged)
				if err := _DavinciDao.contract.UnpackLog(event, "WeightChanged", log); err != nil {
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
func (_DavinciDao *DavinciDaoFilterer) ParseWeightChanged(log types.Log) (*DavinciDaoWeightChanged, error) {
	event := new(DavinciDaoWeightChanged)
	if err := _DavinciDao.contract.UnpackLog(event, "WeightChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
