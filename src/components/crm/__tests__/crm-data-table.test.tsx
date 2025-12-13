import { render, screen, fireEvent } from '@testing-library/react'
import { CRMDataTable } from '../crm-data-table'
import { describe, it, expect, vi } from 'vitest'

const mockData = [
    { id: '1', name: 'Acme Corp', industry: 'Tech', status: 'Active' },
    { id: '2', name: 'Globex', industry: 'Manufacturing', status: 'Inactive' },
]

const mockColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'industry', label: 'Industry' },
    { key: 'status', label: 'Status' },
]

describe('CRMDataTable', () => {
    it('renders data correctly', () => {
        render(<CRMDataTable data={mockData} columns={mockColumns} />)
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('Globex')).toBeInTheDocument()
    })

    it('renders empty state when no data provided', () => {
        render(<CRMDataTable data={[]} columns={mockColumns} emptyMessage="No data here" />)
        expect(screen.getByText('No data here')).toBeInTheDocument()
    })

    it('calls onSearch when typing in search box', () => {
        const handleSearch = vi.fn()
        render(<CRMDataTable data={mockData} columns={mockColumns} onSearch={handleSearch} />)

        const input = screen.getByPlaceholderText('Search...')
        fireEvent.change(input, { target: { value: 'Acme' } })

        expect(handleSearch).toHaveBeenCalledWith('Acme')
    })

    it('calls onSort when clicking sortable header', () => {
        const handleSort = vi.fn()
        render(<CRMDataTable data={mockData} columns={mockColumns} onSort={handleSort} />)

        fireEvent.click(screen.getByText('Name'))
        expect(handleSort).toHaveBeenCalledWith('name', 'asc')
    })
})
