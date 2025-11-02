import { useState } from 'react'
import { Button } from '~/components/common/Button'
import { MerkleTreeNode } from '~/types'
import { formatAddress } from '~/lib/utils'
import { toast } from 'sonner'

// Copy button component
const CopyButton = ({ value, label }: { value: string; label?: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast.success(label ? `${label} copied to clipboard` : 'Copied to clipboard')
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      title={`Copy ${label || 'value'}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  )
}

interface TreeVisualizationModalProps {
  isOpen: boolean
  onClose: () => void
  treeNodes: MerkleTreeNode[]
  censusRoot: string
  isLoading: boolean
  onReconstructTree: () => Promise<void>
}

export const TreeVisualizationModal = ({
  isOpen,
  onClose,
  treeNodes,
  censusRoot,
  isLoading,
  onReconstructTree
}: TreeVisualizationModalProps) => {
  const [sortBy, setSortBy] = useState<'index' | 'address' | 'weight'>('index')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  if (!isOpen) return null

  // Sort nodes based on current sort criteria
  const sortedNodes = [...treeNodes].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'index':
        comparison = a.index - b.index
        break
      case 'address':
        comparison = a.address.localeCompare(b.address)
        break
      case 'weight':
        comparison = a.weight - b.weight
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: 'index' | 'address' | 'weight') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: 'index' | 'address' | 'weight') => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }

  const totalWeight = treeNodes.reduce((sum, node) => sum + node.weight, 0)

  const handleExportJSON = () => {
    // Sort nodes by index for export (chronological order)
    const exportData = [...treeNodes]
      .sort((a, b) => a.index - b.index)
      .map(node => ({
        index: node.index,
        address: node.address,
        weight: node.weight,
        leaf: node.leaf
      }))

    const jsonData = {
      censusRoot,
      totalParticipants: treeNodes.length,
      totalWeight,
      timestamp: new Date().toISOString(),
      leaves: exportData
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `census-tree-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Tree exported successfully')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Merkle Tree Visualization</h2>
            <p className="text-sm text-gray-600 mt-1">
              Current census tree with {treeNodes.length} participants (Total Weight: {totalWeight})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Census Root */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Census Root:</span>
            <code
              className="text-xs bg-gray-200 px-2 py-1 rounded font-mono"
              title={censusRoot}
            >
              {censusRoot}
            </code>
            <CopyButton value={censusRoot} label="Census root" />
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onReconstructTree}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reconstructing...
                </>
              ) : (
                'Reconstruct Tree'
              )}
            </Button>

            <Button
              onClick={handleExportJSON}
              disabled={treeNodes.length === 0}
              size="sm"
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </Button>

            {treeNodes.length > 0 && (
              <span className="text-sm text-gray-600">
                Showing {sortedNodes.length} nodes
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Reconstructing Merkle tree...</p>
              </div>
            </div>
          ) : treeNodes.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 mb-2">No tree data available</p>
                <p className="text-sm text-gray-500">Click "Reconstruct Tree" to load the current census</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('index')}
                    >
                      <div className="flex items-center gap-1">
                        Index
                        {getSortIcon('index')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center gap-1">
                        Address
                        {getSortIcon('address')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('weight')}
                    >
                      <div className="flex items-center gap-1">
                        Weight
                        {getSortIcon('weight')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leaf Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedNodes.map((node, idx) => (
                    <tr key={node.index} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{node.index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <code
                            className="text-sm font-mono bg-gray-100 px-2 py-1 rounded cursor-help"
                            title={node.address}
                          >
                            {formatAddress(node.address)}
                          </code>
                          <CopyButton value={node.address} label="Address" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {node.weight} NFT{node.weight !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <code
                            className="text-xs text-gray-600 font-mono cursor-help"
                            title={node.leaf}
                          >
                            {node.leaf.slice(0, 20)}...{node.leaf.slice(-10)}
                          </code>
                          <CopyButton value={node.leaf} label="Leaf value" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
