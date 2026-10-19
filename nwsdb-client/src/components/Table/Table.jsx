import { Children } from 'react';
import './Table.css';

export function Table({
  children,
  striped = false,
  hoverable = true,
  bordered = false,
  compact = false,
  className = '',
  ...props
}) {
  const tableClasses = [
    'nwsdb-table',
    striped ? 'nwsdb-table--striped' : '',
    hoverable ? 'nwsdb-table--hoverable' : '',
    bordered ? 'nwsdb-table--bordered' : '',
    compact ? 'nwsdb-table--compact' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="nwsdb-table-container">
      <table className={tableClasses} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return <thead className={`nwsdb-table__head ${className}`} {...props}>{children}</thead>;
}

export function TableBody({ children, className = '', emptyMessage = null, ...props }) {
  if (Children.count(children) === 0 && emptyMessage) {
    return (
      <tbody className="nwsdb-table__body">
        <tr>
          <td colSpan={100} className="nwsdb-table__empty">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }
  return <tbody className={`nwsdb-table__body ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({ children, isSelected = false, className = '', onClick, ...props }) {
  return (
    <tr
      className={`nwsdb-table__row ${isSelected ? 'nwsdb-table__row--selected' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, align = 'left', className = '', ...props }) {
  return (
    <th className={`nwsdb-table__header-cell nwsdb-table__cell--align-${align} ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, align = 'left', className = '', ...props }) {
  return (
    <td className={`nwsdb-table__cell nwsdb-table__cell--align-${align} ${className}`} {...props}>
      {children}
    </td>
  );
}

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;

export default Table;
