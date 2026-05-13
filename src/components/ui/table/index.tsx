import { ReactNode } from "react";

// Props for Table
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

// Props for TableHeader
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

// Props for TableBody
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

// Props for TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableCell
interface TableCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className, ...props }) => {
  return <table className={`min-w-full  ${className}`} {...props}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className, ...props }) => {
  return <thead className={className} {...props}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className, ...props }) => {
  return <tbody className={className} {...props}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return <tr className={className} {...props}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  colSpan,
  ...props
}) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={` ${className}`} colSpan={colSpan} {...props}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
