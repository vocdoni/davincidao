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
	Account       common.Address
	CurrentWeight *big.Int
	Siblings      []*big.Int
}

// DavinciDaoMetaData contains all meta data concerning the DavinciDao contract.
var DavinciDaoMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"tokens\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"collections\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"token\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"computeLeafWithWeight\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"weight\",\"type\":\"uint88\",\"internalType\":\"uint88\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"pure\"},{\"type\":\"function\",\"name\":\"delegate\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"currentWeightOfTo\",\"type\":\"uint88\",\"internalType\":\"uint88\"},{\"name\":\"toProof\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getCensusRoot\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getNFTids\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"candidateIds\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[{\"name\":\"out\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getRootBlockNumber\",\"inputs\":[{\"name\":\"root\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getTokenDelegations\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[{\"name\":\"delegates\",\"type\":\"address[]\",\"internalType\":\"address[]\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"tokenDelegate\",\"inputs\":[{\"name\":\"\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"undelegate\",\"inputs\":[{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"proofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDao.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"currentWeight\",\"type\":\"uint88\",\"internalType\":\"uint88\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"updateDelegation\",\"inputs\":[{\"name\":\"to\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"ids\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"currentWeightOfTo\",\"type\":\"uint88\",\"internalType\":\"uint88\"},{\"name\":\"fromProofs\",\"type\":\"tuple[]\",\"internalType\":\"structDavinciDao.ProofInput[]\",\"components\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"currentWeight\",\"type\":\"uint88\",\"internalType\":\"uint88\"},{\"name\":\"siblings\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}]},{\"name\":\"toProof\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"CensusRootUpdated\",\"inputs\":[{\"name\":\"newRoot\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"blockNumber\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Delegated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"to\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"DelegatedBatch\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"to\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenIds\",\"type\":\"uint256[]\",\"indexed\":false,\"internalType\":\"uint256[]\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"Undelegated\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"from\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"UndelegatedBatch\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"from\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nftIndex\",\"type\":\"uint256\",\"indexed\":true,\"internalType\":\"uint256\"},{\"name\":\"tokenIds\",\"type\":\"uint256[]\",\"indexed\":false,\"internalType\":\"uint256[]\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"WeightChanged\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"previousWeight\",\"type\":\"uint88\",\"indexed\":false,\"internalType\":\"uint88\"},{\"name\":\"newWeight\",\"type\":\"uint88\",\"indexed\":false,\"internalType\":\"uint88\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"AlreadyDelegated\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"InvalidBufferSize\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"InvalidCollection\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"InvalidTokenId\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"LeafAlreadyExists\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafCannotBeZero\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafDoesNotExist\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"LeafGreaterThanSnarkScalarField\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NoNewDelegations\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NotDelegated\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"NotTokenOwner\",\"inputs\":[{\"name\":\"tokenId\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"type\":\"error\",\"name\":\"ProofRequired\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"WeightOverflow\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WeightUnderflow\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"WrongSiblingNodes\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"ZeroAddress\",\"inputs\":[]}]",
}

// DavinciDaoABI is the input ABI used to generate the binding from.
// Deprecated: Use DavinciDaoMetaData.ABI instead.
var DavinciDaoABI = DavinciDaoMetaData.ABI

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

// ComputeLeafWithWeight is a free data retrieval call binding the contract method 0x89e8a255.
//
// Solidity: function computeLeafWithWeight(address account, uint88 weight) pure returns(uint256)
func (_DavinciDao *DavinciDaoCaller) ComputeLeafWithWeight(opts *bind.CallOpts, account common.Address, weight *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _DavinciDao.contract.Call(opts, &out, "computeLeafWithWeight", account, weight)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// ComputeLeafWithWeight is a free data retrieval call binding the contract method 0x89e8a255.
//
// Solidity: function computeLeafWithWeight(address account, uint88 weight) pure returns(uint256)
func (_DavinciDao *DavinciDaoSession) ComputeLeafWithWeight(account common.Address, weight *big.Int) (*big.Int, error) {
	return _DavinciDao.Contract.ComputeLeafWithWeight(&_DavinciDao.CallOpts, account, weight)
}

// ComputeLeafWithWeight is a free data retrieval call binding the contract method 0x89e8a255.
//
// Solidity: function computeLeafWithWeight(address account, uint88 weight) pure returns(uint256)
func (_DavinciDao *DavinciDaoCallerSession) ComputeLeafWithWeight(account common.Address, weight *big.Int) (*big.Int, error) {
	return _DavinciDao.Contract.ComputeLeafWithWeight(&_DavinciDao.CallOpts, account, weight)
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

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[] out)
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
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[] out)
func (_DavinciDao *DavinciDaoSession) GetNFTids(nftIndex *big.Int, candidateIds []*big.Int) ([]*big.Int, error) {
	return _DavinciDao.Contract.GetNFTids(&_DavinciDao.CallOpts, nftIndex, candidateIds)
}

// GetNFTids is a free data retrieval call binding the contract method 0x8498be04.
//
// Solidity: function getNFTids(uint256 nftIndex, uint256[] candidateIds) view returns(uint256[] out)
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

// Delegate is a paid mutator transaction binding the contract method 0xe892ad5a.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint88 currentWeightOfTo, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoTransactor) Delegate(opts *bind.TransactOpts, to common.Address, nftIndex *big.Int, ids []*big.Int, currentWeightOfTo *big.Int, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.contract.Transact(opts, "delegate", to, nftIndex, ids, currentWeightOfTo, toProof)
}

// Delegate is a paid mutator transaction binding the contract method 0xe892ad5a.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint88 currentWeightOfTo, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoSession) Delegate(to common.Address, nftIndex *big.Int, ids []*big.Int, currentWeightOfTo *big.Int, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.Contract.Delegate(&_DavinciDao.TransactOpts, to, nftIndex, ids, currentWeightOfTo, toProof)
}

// Delegate is a paid mutator transaction binding the contract method 0xe892ad5a.
//
// Solidity: function delegate(address to, uint256 nftIndex, uint256[] ids, uint88 currentWeightOfTo, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoTransactorSession) Delegate(to common.Address, nftIndex *big.Int, ids []*big.Int, currentWeightOfTo *big.Int, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.Contract.Delegate(&_DavinciDao.TransactOpts, to, nftIndex, ids, currentWeightOfTo, toProof)
}

// Undelegate is a paid mutator transaction binding the contract method 0xe2bc69f4.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint88,uint256[])[] proofs) returns()
func (_DavinciDao *DavinciDaoTransactor) Undelegate(opts *bind.TransactOpts, nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.contract.Transact(opts, "undelegate", nftIndex, ids, proofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0xe2bc69f4.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint88,uint256[])[] proofs) returns()
func (_DavinciDao *DavinciDaoSession) Undelegate(nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.Contract.Undelegate(&_DavinciDao.TransactOpts, nftIndex, ids, proofs)
}

// Undelegate is a paid mutator transaction binding the contract method 0xe2bc69f4.
//
// Solidity: function undelegate(uint256 nftIndex, uint256[] ids, (address,uint88,uint256[])[] proofs) returns()
func (_DavinciDao *DavinciDaoTransactorSession) Undelegate(nftIndex *big.Int, ids []*big.Int, proofs []DavinciDaoProofInput) (*types.Transaction, error) {
	return _DavinciDao.Contract.Undelegate(&_DavinciDao.TransactOpts, nftIndex, ids, proofs)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0x70e3afa2.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, uint88 currentWeightOfTo, (address,uint88,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoTransactor) UpdateDelegation(opts *bind.TransactOpts, to common.Address, nftIndex *big.Int, ids []*big.Int, currentWeightOfTo *big.Int, fromProofs []DavinciDaoProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.contract.Transact(opts, "updateDelegation", to, nftIndex, ids, currentWeightOfTo, fromProofs, toProof)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0x70e3afa2.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, uint88 currentWeightOfTo, (address,uint88,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoSession) UpdateDelegation(to common.Address, nftIndex *big.Int, ids []*big.Int, currentWeightOfTo *big.Int, fromProofs []DavinciDaoProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.Contract.UpdateDelegation(&_DavinciDao.TransactOpts, to, nftIndex, ids, currentWeightOfTo, fromProofs, toProof)
}

// UpdateDelegation is a paid mutator transaction binding the contract method 0x70e3afa2.
//
// Solidity: function updateDelegation(address to, uint256 nftIndex, uint256[] ids, uint88 currentWeightOfTo, (address,uint88,uint256[])[] fromProofs, uint256[] toProof) returns()
func (_DavinciDao *DavinciDaoTransactorSession) UpdateDelegation(to common.Address, nftIndex *big.Int, ids []*big.Int, currentWeightOfTo *big.Int, fromProofs []DavinciDaoProofInput, toProof []*big.Int) (*types.Transaction, error) {
	return _DavinciDao.Contract.UpdateDelegation(&_DavinciDao.TransactOpts, to, nftIndex, ids, currentWeightOfTo, fromProofs, toProof)
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

// DavinciDaoDelegatedBatchIterator is returned from FilterDelegatedBatch and is used to iterate over the raw logs and unpacked data for DelegatedBatch events raised by the DavinciDao contract.
type DavinciDaoDelegatedBatchIterator struct {
	Event *DavinciDaoDelegatedBatch // Event containing the contract specifics and raw log

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
func (it *DavinciDaoDelegatedBatchIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoDelegatedBatch)
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
		it.Event = new(DavinciDaoDelegatedBatch)
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
func (it *DavinciDaoDelegatedBatchIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoDelegatedBatchIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoDelegatedBatch represents a DelegatedBatch event raised by the DavinciDao contract.
type DavinciDaoDelegatedBatch struct {
	Owner    common.Address
	To       common.Address
	NftIndex *big.Int
	TokenIds []*big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterDelegatedBatch is a free log retrieval operation binding the contract event 0x3fe8c5ff8038f409c0e155c58dd77a1d041dc9654f80d372adac435fb5837c30.
//
// Solidity: event DelegatedBatch(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256[] tokenIds)
func (_DavinciDao *DavinciDaoFilterer) FilterDelegatedBatch(opts *bind.FilterOpts, owner []common.Address, to []common.Address, nftIndex []*big.Int) (*DavinciDaoDelegatedBatchIterator, error) {

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

	logs, sub, err := _DavinciDao.contract.FilterLogs(opts, "DelegatedBatch", ownerRule, toRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoDelegatedBatchIterator{contract: _DavinciDao.contract, event: "DelegatedBatch", logs: logs, sub: sub}, nil
}

// WatchDelegatedBatch is a free log subscription operation binding the contract event 0x3fe8c5ff8038f409c0e155c58dd77a1d041dc9654f80d372adac435fb5837c30.
//
// Solidity: event DelegatedBatch(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256[] tokenIds)
func (_DavinciDao *DavinciDaoFilterer) WatchDelegatedBatch(opts *bind.WatchOpts, sink chan<- *DavinciDaoDelegatedBatch, owner []common.Address, to []common.Address, nftIndex []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DavinciDao.contract.WatchLogs(opts, "DelegatedBatch", ownerRule, toRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoDelegatedBatch)
				if err := _DavinciDao.contract.UnpackLog(event, "DelegatedBatch", log); err != nil {
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

// ParseDelegatedBatch is a log parse operation binding the contract event 0x3fe8c5ff8038f409c0e155c58dd77a1d041dc9654f80d372adac435fb5837c30.
//
// Solidity: event DelegatedBatch(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256[] tokenIds)
func (_DavinciDao *DavinciDaoFilterer) ParseDelegatedBatch(log types.Log) (*DavinciDaoDelegatedBatch, error) {
	event := new(DavinciDaoDelegatedBatch)
	if err := _DavinciDao.contract.UnpackLog(event, "DelegatedBatch", log); err != nil {
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

// DavinciDaoUndelegatedBatchIterator is returned from FilterUndelegatedBatch and is used to iterate over the raw logs and unpacked data for UndelegatedBatch events raised by the DavinciDao contract.
type DavinciDaoUndelegatedBatchIterator struct {
	Event *DavinciDaoUndelegatedBatch // Event containing the contract specifics and raw log

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
func (it *DavinciDaoUndelegatedBatchIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DavinciDaoUndelegatedBatch)
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
		it.Event = new(DavinciDaoUndelegatedBatch)
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
func (it *DavinciDaoUndelegatedBatchIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DavinciDaoUndelegatedBatchIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DavinciDaoUndelegatedBatch represents a UndelegatedBatch event raised by the DavinciDao contract.
type DavinciDaoUndelegatedBatch struct {
	Owner    common.Address
	From     common.Address
	NftIndex *big.Int
	TokenIds []*big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterUndelegatedBatch is a free log retrieval operation binding the contract event 0x56017da320cb00880eb511a7183d19ed30ca4f9bcf6bf1dffa02ccb76da33915.
//
// Solidity: event UndelegatedBatch(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256[] tokenIds)
func (_DavinciDao *DavinciDaoFilterer) FilterUndelegatedBatch(opts *bind.FilterOpts, owner []common.Address, from []common.Address, nftIndex []*big.Int) (*DavinciDaoUndelegatedBatchIterator, error) {

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

	logs, sub, err := _DavinciDao.contract.FilterLogs(opts, "UndelegatedBatch", ownerRule, fromRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return &DavinciDaoUndelegatedBatchIterator{contract: _DavinciDao.contract, event: "UndelegatedBatch", logs: logs, sub: sub}, nil
}

// WatchUndelegatedBatch is a free log subscription operation binding the contract event 0x56017da320cb00880eb511a7183d19ed30ca4f9bcf6bf1dffa02ccb76da33915.
//
// Solidity: event UndelegatedBatch(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256[] tokenIds)
func (_DavinciDao *DavinciDaoFilterer) WatchUndelegatedBatch(opts *bind.WatchOpts, sink chan<- *DavinciDaoUndelegatedBatch, owner []common.Address, from []common.Address, nftIndex []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DavinciDao.contract.WatchLogs(opts, "UndelegatedBatch", ownerRule, fromRule, nftIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DavinciDaoUndelegatedBatch)
				if err := _DavinciDao.contract.UnpackLog(event, "UndelegatedBatch", log); err != nil {
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

// ParseUndelegatedBatch is a log parse operation binding the contract event 0x56017da320cb00880eb511a7183d19ed30ca4f9bcf6bf1dffa02ccb76da33915.
//
// Solidity: event UndelegatedBatch(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256[] tokenIds)
func (_DavinciDao *DavinciDaoFilterer) ParseUndelegatedBatch(log types.Log) (*DavinciDaoUndelegatedBatch, error) {
	event := new(DavinciDaoUndelegatedBatch)
	if err := _DavinciDao.contract.UnpackLog(event, "UndelegatedBatch", log); err != nil {
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
