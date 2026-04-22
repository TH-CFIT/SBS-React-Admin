import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, X, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react';

interface ShipmentLog {
  created_at: string;
  log_type: string;
  respond_trackingnumber: string | null;
  shipper_name: string | null;
  shipper_company: string | null;
  shipper_email: string | null;
  shipper_country: string | null;
  receiver_name: string | null;
  receiver_company: string | null;
  receiver_email: string | null;
  receiver_country: string | null;
  request_reference: string | null;
  shipper_account_number: string | null;
  duty_account_number: string | null;
  booking_ref: string | null;
  respond_warnings: string | null;
  respond_label: string | null;
  respond_receipt: string | null;
  respond_invoice: string | null;
}

type SortColumn = 'created_at' | 'respond_trackingnumber' | 'shipper_name' | 'receiver_name' | 'shipper_email' | 'request_reference' | 'booking_ref';
type SortDirection = 'asc' | 'desc';

const API_BASE_URL = '/api';

export const SearchPage: React.FC = () => {
  const { language, t } = useLanguage();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    trackingNumber: '',
    bookingRef: '',
    reference: '',
    accountNumber: '',
    shipperName: '',
    receiverName: '',
    phone: '',
    email: '',
    shipperCountry: '',
    receiverCountry: '',
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    timeFrom: '',
    timeTo: '',
  });

  // Results state
  const [allLogs, setAllLogs] = useState<ShipmentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination & sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const rowsPerPage = 10;

  const showTimeFilter = filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo;

  const updateFilter = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const sortData = useCallback((data: ShipmentLog[], col: SortColumn, dir: SortDirection) => {
    return [...data].sort((a, b) => {
      let valA: any = a[col];
      let valB: any = b[col];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (col === 'shipper_email') {
        valA = a.shipper_email || a.receiver_email;
        valB = b.shipper_email || b.receiver_email;
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;

      return dir === 'desc' ? comparison * -1 : comparison;
    });
  }, []);

  const handleSort = (column: SortColumn) => {
    let newDirection: SortDirection = 'asc';
    if (sortColumn === column) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    setAllLogs((prev) => sortData(prev, column, newDirection));
    setCurrentPage(1);
  };

  const fetchLogs = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const env = sessionStorage.getItem('dbs_environment') || 'Prod';
    const tableName = env === 'Test' ? 'shipment_test_logs' : 'shipment_logs';
    params.append('table', tableName);

    try {
      const response = await fetch(`${API_BASE_URL}/query-logs?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      const data: ShipmentLog[] = await response.json();
      const sorted = sortData(data, sortColumn, sortDirection);
      setAllLogs(sorted);
      setCurrentPage(1);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted.');
      } else {
        console.error('Error fetching logs:', error);
        setErrorMessage(t('errorLoading'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFilters({
      trackingNumber: '',
      bookingRef: '',
      reference: '',
      accountNumber: '',
      shipperName: '',
      receiverName: '',
      phone: '',
      email: '',
      shipperCountry: '',
      receiverCountry: '',
      dateFrom: today,
      dateTo: today,
      timeFrom: '',
      timeTo: '',
    });
    setAllLogs([]);
    setHasSearched(false);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // PDF download
  const downloadPdfFromBase64 = (base64String: string, fileName: string) => {
    try {
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
      alert(t('downloadFailed'));
    }
  };

  // CSV export
  const exportToCSV = () => {
    if (allLogs.length === 0) return;
    const headers = [
      'Created At', 'Log Type', 'Tracking Number', 'Shipper Name', 'Shipper Company', 'Shipper Email', 'Shipper Country',
      'Receiver Name', 'Receiver Company', 'Receiver Email', 'Receiver Country', 'Request Reference', 'Shipper Account', 'Duty Account',
      'Booking Ref', 'Respond Warnings',
    ];
    const escapeCsvCell = (cell: any) => {
      const str = cell === null || cell === undefined ? '' : String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvRows = [headers.join(',')];
    allLogs.forEach((log) => {
      const row = [
        log.created_at, log.log_type, log.respond_trackingnumber, log.shipper_name, log.shipper_company,
        log.shipper_email, log.shipper_country, log.receiver_name, log.receiver_company, log.receiver_email,
        log.receiver_country, log.request_reference, log.shipper_account_number, log.duty_account_number,
        log.booking_ref, log.respond_warnings,
      ].map(escapeCsvCell);
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    link.download = `sbs_export_${today}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const dateObj = new Date(dateStr);
      const time = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const year = language === 'th' ? dateObj.getFullYear() + 543 : dateObj.getFullYear();
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNamesTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthName = language === 'th' ? monthNamesTh[dateObj.getMonth()] : monthNamesEn[dateObj.getMonth()];
      return `${dateObj.getDate()} ${monthName} ${String(year).slice(-2)}, ${time}`;
    } catch {
      return dateStr.substring(0, 16);
    }
  };

  // Pagination
  const totalPages = Math.ceil(allLogs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLogs = allLogs.slice(startIndex, startIndex + rowsPerPage);
  const pageInfoText = t('pageInfo')
    .replace('{currentPage}', String(currentPage))
    .replace('{totalPages}', String(totalPages || 1));

  const SortIcon: React.FC<{ column: SortColumn }> = ({ column }) => {
    if (sortColumn !== column) return <ChevronUp className="w-3 h-3 opacity-30 ml-1 inline-block" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 inline-block text-dhl-red" />
      : <ChevronDown className="w-3 h-3 ml-1 inline-block text-dhl-red" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            (sessionStorage.getItem('dbs_environment') || 'Prod') === 'Test' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {(sessionStorage.getItem('dbs_environment') || 'Prod') === 'Test' ? 'TEST ENV' : 'PRODUCTION ENV'}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Shipment Detail */}
          <fieldset className="filter-group">
            <legend>{t('groupShipmentId')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
              <div>
                <label htmlFor="f-tracking" className="block text-sm font-medium mb-1">{t('trackingNumber')}</label>
                <input id="f-tracking" type="text" className="input-field" value={filters.trackingNumber} onChange={(e) => updateFilter('trackingNumber', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-booking" className="block text-sm font-medium mb-1">{t('bookingReference')}</label>
                <input id="f-booking" type="text" className="input-field" placeholder="CBJ..." value={filters.bookingRef} onChange={(e) => updateFilter('bookingRef', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-reference" className="block text-sm font-medium mb-1">{t('reference')}</label>
                <input id="f-reference" type="text" className="input-field" value={filters.reference} onChange={(e) => updateFilter('reference', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-account" className="block text-sm font-medium mb-1">{t('accountNumber')}</label>
                <input id="f-account" type="text" className="input-field" placeholder="Shipper or Duty Account" value={filters.accountNumber} onChange={(e) => updateFilter('accountNumber', e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* Customer Detail */}
          <fieldset className="filter-group">
            <legend>{t('groupCustomerDetail')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div>
                <label htmlFor="f-shipper" className="block text-sm font-medium mb-1">{t('shipperName')}</label>
                <input id="f-shipper" type="text" className="input-field" value={filters.shipperName} onChange={(e) => updateFilter('shipperName', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-receiver" className="block text-sm font-medium mb-1">{t('receiverName')}</label>
                <input id="f-receiver" type="text" className="input-field" value={filters.receiverName} onChange={(e) => updateFilter('receiverName', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-phone" className="block text-sm font-medium mb-1">{t('phone')}</label>
                <input id="f-phone" type="text" className="input-field" value={filters.phone} onChange={(e) => updateFilter('phone', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-email" className="block text-sm font-medium mb-1">{t('email')}</label>
                <input id="f-email" type="email" className="input-field" value={filters.email} onChange={(e) => updateFilter('email', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-scountry" className="block text-sm font-medium mb-1">{t('shipperCountry')}</label>
                <input id="f-scountry" type="text" className="input-field" placeholder="Country Code" value={filters.shipperCountry} onChange={(e) => updateFilter('shipperCountry', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-rcountry" className="block text-sm font-medium mb-1">{t('receiverCountry')}</label>
                <input id="f-rcountry" type="text" className="input-field" placeholder="Country Code" value={filters.receiverCountry} onChange={(e) => updateFilter('receiverCountry', e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* Date & Time */}
          <fieldset className="filter-group">
            <legend>{t('groupDateTime')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
              <div>
                <label htmlFor="f-datefrom" className="block text-sm font-medium mb-1">{t('dateFrom')}</label>
                <input id="f-datefrom" type="date" className="input-field" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
              </div>
              <div>
                <label htmlFor="f-dateto" className="block text-sm font-medium mb-1">{t('dateTo')}</label>
                <input id="f-dateto" type="date" className="input-field" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
              </div>
              {showTimeFilter && (
                <>
                  <div>
                    <label htmlFor="f-timefrom" className="block text-sm font-medium mb-1">{t('timeFrom')}</label>
                    <input id="f-timefrom" type="time" className="input-field" value={filters.timeFrom} onChange={(e) => updateFilter('timeFrom', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="f-timeto" className="block text-sm font-medium mb-1">{t('timeTo')}</label>
                    <input id="f-timeto" type="time" className="input-field" value={filters.timeTo} onChange={(e) => updateFilter('timeTo', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </fieldset>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button type="submit" disabled={isLoading} className="btn-primary btn-yellow flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t('search')}
            </button>
            <button type="button" onClick={handleClear} className="btn-primary btn-gray flex items-center gap-2">
              <X className="w-4 h-4" />
              {t('clear')}
            </button>
            {allLogs.length > 0 && (
              <button type="button" onClick={exportToCSV} className="btn-primary btn-gray flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t('exportCsv')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-dhl-red mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
        </div>
      )}

      {!isLoading && hasSearched && allLogs.length === 0 && !errorMessage && (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('noResults')}</p>
        </div>
      )}

      {errorMessage && (
        <div className="card text-center py-8">
          <p className="text-red-500 font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && allLogs.length > 0 && (
        <>
          <div className="card !p-0 table-responsive">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  {([
                    { key: 'created_at' as SortColumn, label: t('colDate') },
                    { key: 'respond_trackingnumber' as SortColumn, label: t('colTracking') },
                    { key: 'shipper_name' as SortColumn, label: t('colShipper') },
                    { key: 'receiver_name' as SortColumn, label: t('colReceiver') },
                    { key: 'shipper_email' as SortColumn, label: t('colEmail') },
                    { key: 'request_reference' as SortColumn, label: t('colRef') },
                  ]).map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider sortable-header cursor-pointer select-none"
                    >
                      {label}
                      <SortIcon column={key} />
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('colAccount')}</th>
                  <th
                    onClick={() => handleSort('booking_ref')}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider sortable-header cursor-pointer select-none"
                  >
                    {t('colBookingRef')}
                    <SortIcon column="booking_ref" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('colDownloads')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedLogs.map((log, index) => {
                  const accountDisplay = [log.shipper_account_number, log.duty_account_number].filter(Boolean).join(' / ');
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.log_type === 'Error' ? (
                          <span className="text-red-500 font-bold">Error</span>
                        ) : (
                          <span className="font-medium text-dhl-red dark:text-amber-400">{log.respond_trackingnumber || ''}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>{log.shipper_name || ''} {log.shipper_country ? `(${log.shipper_country})` : ''}</div>
                        <div className="text-xs text-gray-500">{log.shipper_company || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>{log.receiver_name || ''} {log.receiver_country ? `(${log.receiver_country})` : ''}</div>
                        <div className="text-xs text-gray-500">{log.receiver_company || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.shipper_email && <div className="text-xs">S: {log.shipper_email}</div>}
                        {log.receiver_email && <div className="text-xs">R: {log.receiver_email}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.request_reference || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{accountDisplay}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.booking_ref || ''}</td>
                      <td className="px-6 py-4 text-sm">
                        {log.log_type === 'Error' ? (
                          <div className="text-red-500 text-xs max-w-xs">
                            {log.respond_warnings || 'Error log without specific warning.'}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 md:flex-row md:gap-1">
                            {log.respond_label && (
                              <button
                                onClick={() => downloadPdfFromBase64(log.respond_label!, `${log.respond_trackingnumber || 'doc'}_Label.pdf`)}
                                className="btn-download btn-download-label"
                              >
                                {t('downloadLabel')}
                              </button>
                            )}
                            {log.respond_receipt && (
                              <button
                                onClick={() => downloadPdfFromBase64(log.respond_receipt!, `${log.respond_trackingnumber || 'doc'}_Receipt.pdf`)}
                                className="btn-download btn-download-doc"
                              >
                                {t('downloadReceipt')}
                              </button>
                            )}
                            {log.respond_invoice && (
                              <button
                                onClick={() => downloadPdfFromBase64(log.respond_invoice!, `${log.respond_trackingnumber || 'doc'}_Invoice.pdf`)}
                                className="btn-download btn-download-doc"
                              >
                                {t('downloadInvoice')}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-primary btn-gray !py-2 !px-4 flex items-center gap-1 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{pageInfoText}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="btn-primary btn-gray !py-2 !px-4 flex items-center gap-1 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
