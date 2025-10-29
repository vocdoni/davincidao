#!/bin/bash
contract="0xD1E08B00B3f1fEe78AD6365bcDDc40838cC73d11"
rpc="https://w3.ch4in.net/sepolia"

echo "Checking tree size by iterating through indices..."
count=0
for i in {0..300}; do
    addr=$(cast call $contract "getAccountAt(uint256)(address)" $i --rpc-url $rpc 2>/dev/null)
    if [ "$addr" = "0x0000000000000000000000000000000000000000" ]; then
        break
    fi
    ((count++))
done

echo "Tree has $count participants (non-zero addresses)"
