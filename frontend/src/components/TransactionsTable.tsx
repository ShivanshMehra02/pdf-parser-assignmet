'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';

interface Transaction {
  id: number;
  documentNumber: string;
  documentYear: string;
  documentDate: string;
  buyerName: string;
  buyerNameTamil: string;
  sellerName: string;
  sellerNameTamil: string;
  houseNumber: string;
  surveyNumber: string;
  plotNumber: string;
  propertyType: string;
  propertyExtent: string;
  village: string;
  considerationValue: string;
  marketValue: string;
  pdfFileName: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

const columnHelper = createColumnHelper<Transaction>();

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const columns = [
    columnHelper.accessor('documentNumber', {
      header: 'Doc No.',
      cell: (info) => (
        <span className="font-medium text-slate-700">
          {info.getValue()}/{info.row.original.documentYear}
        </span>
      ),
    }),
    columnHelper.accessor('documentDate', {
      header: 'Date',
      cell: (info) => {
        const date = info.getValue();
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-IN');
      },
    }),
    columnHelper.accessor('buyerName', {
      header: 'Buyer',
      cell: (info) => (
        <div>
          <div className="font-medium text-slate-700">{info.getValue() || '-'}</div>
          {info.row.original.buyerNameTamil && (
            <div className="text-xs text-slate-500">{info.row.original.buyerNameTamil}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('sellerName', {
      header: 'Seller',
      cell: (info) => (
        <div>
          <div className="font-medium text-slate-700">{info.getValue() || '-'}</div>
          {info.row.original.sellerNameTamil && (
            <div className="text-xs text-slate-500">{info.row.original.sellerNameTamil}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('surveyNumber', {
      header: 'Survey No.',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('plotNumber', {
      header: 'Plot No.',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('propertyType', {
      header: 'Property Type',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('considerationValue', {
      header: 'Value (₹)',
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '-';
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(parseFloat(value));
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button
          onClick={() => setSelectedTransaction(info.row.original)}
          className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
          data-testid={`view-transaction-${info.row.original.id}`}
        >
          <Eye size={18} />
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="data-table" data-testid="transactions-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-600">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            transactions.length
          )}{' '}
          of {transactions.length} results
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Document Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Document Number</p>
                    <p className="font-medium text-slate-800">
                      {selectedTransaction.documentNumber}/{selectedTransaction.documentYear}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-medium text-slate-800">
                      {selectedTransaction.documentDate
                        ? new Date(selectedTransaction.documentDate).toLocaleDateString('en-IN')
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Parties Involved
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Buyer (Claimant)</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedTransaction.buyerName || '-'}
                    </p>
                    {selectedTransaction.buyerNameTamil && (
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedTransaction.buyerNameTamil}
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Seller (Executant)</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedTransaction.sellerName || '-'}
                    </p>
                    {selectedTransaction.sellerNameTamil && (
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedTransaction.sellerNameTamil}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Property Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Survey Number</p>
                    <p className="font-medium text-slate-800">{selectedTransaction.surveyNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Plot Number</p>
                    <p className="font-medium text-slate-800">{selectedTransaction.plotNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">House Number</p>
                    <p className="font-medium text-slate-800">{selectedTransaction.houseNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Property Type</p>
                    <p className="font-medium text-slate-800">{selectedTransaction.propertyType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Property Extent</p>
                    <p className="font-medium text-slate-800">{selectedTransaction.propertyExtent || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Village</p>
                    <p className="font-medium text-slate-800">{selectedTransaction.village || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Financial Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Consideration Value</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">
                      {selectedTransaction.considerationValue
                        ? new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(parseFloat(selectedTransaction.considerationValue))
                        : '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Market Value</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">
                      {selectedTransaction.marketValue
                        ? new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(parseFloat(selectedTransaction.marketValue))
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
