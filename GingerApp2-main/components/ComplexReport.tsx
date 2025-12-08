import React, { useMemo } from 'react';
import { Transaction, MonthlyStats } from '../types';

interface Props {
  transactions: Transaction[];
}

const ComplexReport: React.FC<Props> = ({ transactions }) => {
  
  const reportData = useMemo(() => {
    const monthsMap = new Map<string, MonthlyStats>();

    // Helper to get or create month stats
    const getMonthStats = (dateStr: string): MonthlyStats => {
        const date = new Date(dateStr);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const key = `${monthName}-${String(year).slice(-2)}`; // e.g., Jan-25

        if (!monthsMap.has(key)) {
            monthsMap.set(key, {
                month: key,
                year: year,
                monthIndex: date.getMonth(),
                burimi_income_ginger: 0,
                burimi_expense_ginger: 0,
                burimi_transfer: 0,
                burimi_income_other: 0,
                burimi_expense_other: 0,
                burimi_total: 0,
                skenderi_income_ginger: 0,
                skenderi_expense_ginger: 0,
                skenderi_transfer: 0,
                skenderi_income_other: 0,
                skenderi_expense_other: 0,
                skenderi_total: 0,
                pos: 0,
                total_net: 0
            });
        }
        return monthsMap.get(key)!;
    };

    transactions.forEach(t => {
        const stats = getMonthStats(t.date);
        const isGinger = t.subCategory === 'GINGER';
        
        // Burimi Logic
        if (t.name === 'Burimi') {
            if (t.category === 'Te Hyra') {
                if (isGinger) stats.burimi_income_ginger += t.amount;
                else stats.burimi_income_other += t.amount;
            } else if (t.category === 'Shpenzime') {
                if (isGinger) stats.burimi_expense_ginger += t.amount;
                else stats.burimi_expense_other += t.amount;
            } else if (t.category === 'Transfere') {
                stats.burimi_transfer += t.amount;
            }
        } 
        // Skenderi Logic
        else if (t.name === 'Skenderi') {
             if (t.category === 'Te Hyra') {
                if (isGinger) stats.skenderi_income_ginger += t.amount;
                else stats.skenderi_income_other += t.amount;
            } else if (t.category === 'Shpenzime') {
                if (isGinger) stats.skenderi_expense_ginger += t.amount;
                else stats.skenderi_expense_other += t.amount;
            } else if (t.category === 'Transfere') {
                stats.skenderi_transfer += t.amount;
            }
        }

        if (t.subCategory === 'POS') {
            stats.pos += t.amount;
        }
    });

    // Calculate Totals per row
    const result = Array.from(monthsMap.values()).map(stats => {
        // Burimi Total = Te Hyra Ginger + Te Hyra (Non-G) + Transfere (from Skenderi) - Transfere (out) - Shpenzime GINGER - Shpenzime (Non-G)
        stats.burimi_total = (stats.burimi_income_ginger + stats.burimi_income_other) 
                           + stats.skenderi_transfer 
                           - stats.burimi_transfer 
                           - stats.burimi_expense_ginger 
                           - stats.burimi_expense_other;
        
        // Skenderi Total = Te Hyra Ginger + Te Hyra (Non-G) + Transfere (from Burimi) - Transfere (out) - Shpenzime GINGER - Shpenzime (Non-G)
        stats.skenderi_total = (stats.skenderi_income_ginger + stats.skenderi_income_other) 
                             + stats.burimi_transfer 
                             - stats.skenderi_transfer 
                             - stats.skenderi_expense_ginger 
                             - stats.skenderi_expense_other;

        stats.total_net = stats.burimi_total + stats.skenderi_total; // Grand Total

        return stats;
    });

    // Sort by year then month index
    return result.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
    });

  }, [transactions]);

  // Totals for Footer
  const totals = reportData.reduce((acc, curr) => ({
      b_in_g: acc.b_in_g + curr.burimi_income_ginger,
      b_out_g: acc.b_out_g + curr.burimi_expense_ginger,
      b_tr: acc.b_tr + curr.burimi_transfer,
      b_in_o: acc.b_in_o + curr.burimi_income_other,
      b_out_o: acc.b_out_o + curr.burimi_expense_other,
      b_tot: acc.b_tot + curr.burimi_total,
      
      s_in_g: acc.s_in_g + curr.skenderi_income_ginger,
      s_out_g: acc.s_out_g + curr.skenderi_expense_ginger,
      s_tr: acc.s_tr + curr.skenderi_transfer,
      s_in_o: acc.s_in_o + curr.skenderi_income_other,
      s_out_o: acc.s_out_o + curr.skenderi_expense_other,
      s_tot: acc.s_tot + curr.skenderi_total,

      pos: acc.pos + curr.pos,
      grand: acc.grand + curr.total_net
  }), {
      b_in_g: 0, b_out_g: 0, b_tr: 0, b_in_o: 0, b_out_o: 0, b_tot: 0,
      s_in_g: 0, s_out_g: 0, s_tr: 0, s_in_o: 0, s_out_o: 0, s_tot: 0,
      pos: 0, grand: 0
  });

  const formatCcy = (val: number) => {
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Group data by year for individual year tables
  const dataByYear = useMemo(() => {
    const yearMap = new Map<number, MonthlyStats[]>();
    reportData.forEach(row => {
      if (!yearMap.has(row.year)) {
        yearMap.set(row.year, []);
      }
      yearMap.get(row.year)!.push(row);
    });
    return Array.from(yearMap.entries()).sort((a, b) => b[0] - a[0]); // Sort descending by year
  }, [reportData]);

  return (
    <div className="space-y-6 mt-6">
      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 bg-green-100 border-b border-green-200 text-center">
              <h3 className="text-xl font-bold text-green-900">Raporti i Përgjithshëm</h3>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                  <thead>
                      <tr className="bg-gray-100 text-gray-700">
                          <th className="p-2 border border-gray-300 text-left bg-white sticky left-0 z-10 w-24">Month</th>
                          
                          {/* Burimi Header */}
                          <th className="p-2 border border-gray-300 bg-gray-50" colSpan={6}>Burimi</th>
                          
                          {/* Skenderi Header */}
                          <th className="p-2 border border-gray-300 bg-gray-50" colSpan={6}>Skenderi</th>
                          
                          <th className="p-2 border border-gray-300" rowSpan={2}>POS</th>
                          <th className="p-2 border border-gray-300 font-bold bg-blue-50" rowSpan={2}>TOTAL</th>
                      </tr>
                      <tr className="bg-gray-50 text-[10px] leading-tight text-gray-600">
                           {/* Empty for sticky month */}
                          <th className="p-1 border border-gray-300 sticky left-0 bg-white z-10"></th>

                          {/* Burimi Cols */}
                          <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>GINGER</th>
                          <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>GINGER</th>
                          <th className="p-1 border border-gray-300 w-24">Transfere</th>
                          <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>(Non-G)</th>
                          <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>(Non-G)</th>
                          <th className="p-1 border border-gray-300 font-bold w-24">Total<br/>Burimi</th>

                          {/* Skenderi Cols */}
                          <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>GINGER</th>
                          <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>GINGER</th>
                          <th className="p-1 border border-gray-300 w-24">Transfere</th>
                          <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>(Non-G)</th>
                          <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>(Non-G)</th>
                          <th className="p-1 border border-gray-300 font-bold w-24">Total<br/>Skenderi</th>
                      </tr>
                  </thead>
                  <tbody>
                      {reportData.map((row) => (
                          <tr key={row.month} className="hover:bg-gray-50">
                              <td className="p-2 border border-gray-300 text-left font-bold sticky left-0 bg-white">{row.month}</td>
                              
                              {/* Burimi Values */}
                              <td className="p-2 border border-gray-300 bg-green-50">{row.burimi_income_ginger ? formatCcy(row.burimi_income_ginger) : '-'}</td>
                              <td className="p-2 border border-gray-300 bg-red-50">{row.burimi_expense_ginger ? formatCcy(row.burimi_expense_ginger) : '-'}</td>
                              <td className="p-2 border border-gray-300">{row.burimi_transfer ? formatCcy(row.burimi_transfer) : '-'}</td>
                              <td className="p-2 border border-gray-300 bg-green-50">{row.burimi_income_other ? formatCcy(row.burimi_income_other) : '-'}</td>
                              <td className="p-2 border border-gray-300 bg-red-50">{row.burimi_expense_other ? formatCcy(row.burimi_expense_other) : '-'}</td>
                              <td className={`p-2 border border-gray-300 font-bold ${row.burimi_total < 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-900'}`}>{formatCcy(row.burimi_total)}</td>

                              {/* Skenderi Values */}
                              <td className="p-2 border border-gray-300 bg-green-50">{row.skenderi_income_ginger ? formatCcy(row.skenderi_income_ginger) : '-'}</td>
                              <td className="p-2 border border-gray-300 bg-red-50">{row.skenderi_expense_ginger ? formatCcy(row.skenderi_expense_ginger) : '-'}</td>
                              <td className="p-2 border border-gray-300">{row.skenderi_transfer ? formatCcy(row.skenderi_transfer) : '-'}</td>
                              <td className="p-2 border border-gray-300 bg-green-50">{row.skenderi_income_other ? formatCcy(row.skenderi_income_other) : '-'}</td>
                              <td className="p-2 border border-gray-300 bg-red-50">{row.skenderi_expense_other ? formatCcy(row.skenderi_expense_other) : '-'}</td>
                              <td className={`p-2 border border-gray-300 font-bold ${row.skenderi_total < 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-900'}`}>{formatCcy(row.skenderi_total)}</td>

                              <td className="p-2 border border-gray-300">{row.pos ? formatCcy(row.pos) : '-'}</td>
                              <td className="p-2 border border-gray-300 font-bold bg-blue-50">{formatCcy(row.total_net)}</td>
                          </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-gray-800 text-white font-bold">
                          <td className="p-2 border border-gray-600 sticky left-0 bg-gray-800">TOTAL</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.b_in_g)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.b_out_g)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.b_tr)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.b_in_o)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.b_out_o)}</td>
                          <td className={`p-2 border border-gray-600 ${totals.b_tot < 0 ? 'text-red-300' : 'text-green-300'}`}>{formatCcy(totals.b_tot)}</td>

                          <td className="p-2 border border-gray-600">{formatCcy(totals.s_in_g)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.s_out_g)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.s_tr)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.s_in_o)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.s_out_o)}</td>
                          <td className={`p-2 border border-gray-600 ${totals.s_tot < 0 ? 'text-red-300' : 'text-green-300'}`}>{formatCcy(totals.s_tot)}</td>

                          <td className="p-2 border border-gray-600">{formatCcy(totals.pos)}</td>
                          <td className="p-2 border border-gray-600">{formatCcy(totals.grand)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

      {/* Individual Year Tables */}
      {dataByYear.map(([year, yearData]) => (
        <div key={year} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 bg-green-100 border-b border-green-200 text-center">
                <h3 className="text-xl font-bold text-green-900">Raporti për vitin {year}</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="p-2 border border-gray-300 text-left bg-white sticky left-0 z-10 w-24">Month</th>
                            
                            {/* Burimi Header */}
                            <th className="p-2 border border-gray-300 bg-gray-50" colSpan={6}>Burimi</th>
                            
                            {/* Skenderi Header */}
                            <th className="p-2 border border-gray-300 bg-gray-50" colSpan={6}>Skenderi</th>
                            
                            <th className="p-2 border border-gray-300" rowSpan={2}>POS</th>
                            <th className="p-2 border border-gray-300 font-bold bg-blue-50" rowSpan={2}>TOTAL</th>
                        </tr>
                        <tr className="bg-gray-50 text-[10px] leading-tight text-gray-600">
                             {/* Empty for sticky month */}
                            <th className="p-1 border border-gray-300 sticky left-0 bg-white z-10"></th>

                            {/* Burimi Cols */}
                            <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>GINGER</th>
                            <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>GINGER</th>
                            <th className="p-1 border border-gray-300 w-24">Transfere</th>
                            <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>(Non-G)</th>
                            <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>(Non-G)</th>
                            <th className="p-1 border border-gray-300 font-bold w-24">Total<br/>Burimi</th>

                            {/* Skenderi Cols */}
                            <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>GINGER</th>
                            <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>GINGER</th>
                            <th className="p-1 border border-gray-300 w-24">Transfere</th>
                            <th className="p-1 border border-gray-300 w-24">Te Hyra<br/>(Non-G)</th>
                            <th className="p-1 border border-gray-300 w-24">Shpenzime<br/>(Non-G)</th>
                            <th className="p-1 border border-gray-300 font-bold w-24">Total<br/>Skenderi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yearData.map((row) => (
                            <tr key={row.month} className="hover:bg-gray-50">
                                <td className="p-2 border border-gray-300 text-left font-bold sticky left-0 bg-white">{row.month}</td>
                                
                                {/* Burimi Values */}
                                <td className="p-2 border border-gray-300 bg-green-50">{row.burimi_income_ginger ? formatCcy(row.burimi_income_ginger) : '-'}</td>
                                <td className="p-2 border border-gray-300 bg-red-50">{row.burimi_expense_ginger ? formatCcy(row.burimi_expense_ginger) : '-'}</td>
                                <td className="p-2 border border-gray-300">{row.burimi_transfer ? formatCcy(row.burimi_transfer) : '-'}</td>
                                <td className="p-2 border border-gray-300 bg-green-50">{row.burimi_income_other ? formatCcy(row.burimi_income_other) : '-'}</td>
                                <td className="p-2 border border-gray-300 bg-red-50">{row.burimi_expense_other ? formatCcy(row.burimi_expense_other) : '-'}</td>
                                <td className={`p-2 border border-gray-300 font-bold ${row.burimi_total < 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-900'}`}>{formatCcy(row.burimi_total)}</td>

                                {/* Skenderi Values */}
                                <td className="p-2 border border-gray-300 bg-green-50">{row.skenderi_income_ginger ? formatCcy(row.skenderi_income_ginger) : '-'}</td>
                                <td className="p-2 border border-gray-300 bg-red-50">{row.skenderi_expense_ginger ? formatCcy(row.skenderi_expense_ginger) : '-'}</td>
                                <td className="p-2 border border-gray-300">{row.skenderi_transfer ? formatCcy(row.skenderi_transfer) : '-'}</td>
                                <td className="p-2 border border-gray-300 bg-green-50">{row.skenderi_income_other ? formatCcy(row.skenderi_income_other) : '-'}</td>
                                <td className="p-2 border border-gray-300 bg-red-50">{row.skenderi_expense_other ? formatCcy(row.skenderi_expense_other) : '-'}</td>
                                <td className={`p-2 border border-gray-300 font-bold ${row.skenderi_total < 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-900'}`}>{formatCcy(row.skenderi_total)}</td>

                                <td className="p-2 border border-gray-300">{row.pos ? formatCcy(row.pos) : '-'}</td>
                                <td className="p-2 border border-gray-300 font-bold bg-blue-50">{formatCcy(row.total_net)}</td>
                            </tr>
                        ))}
                        {/* Year Totals Row */}
                        {(() => {
                          const yearTotals = yearData.reduce((acc, curr) => ({
                              b_in_g: acc.b_in_g + curr.burimi_income_ginger,
                              b_out_g: acc.b_out_g + curr.burimi_expense_ginger,
                              b_tr: acc.b_tr + curr.burimi_transfer,
                              b_in_o: acc.b_in_o + curr.burimi_income_other,
                              b_out_o: acc.b_out_o + curr.burimi_expense_other,
                              b_tot: acc.b_tot + curr.burimi_total,
                              
                              s_in_g: acc.s_in_g + curr.skenderi_income_ginger,
                              s_out_g: acc.s_out_g + curr.skenderi_expense_ginger,
                              s_tr: acc.s_tr + curr.skenderi_transfer,
                              s_in_o: acc.s_in_o + curr.skenderi_income_other,
                              s_out_o: acc.s_out_o + curr.skenderi_expense_other,
                              s_tot: acc.s_tot + curr.skenderi_total,

                              pos: acc.pos + curr.pos,
                              grand: acc.grand + curr.total_net
                          }), {
                              b_in_g: 0, b_out_g: 0, b_tr: 0, b_in_o: 0, b_out_o: 0, b_tot: 0,
                              s_in_g: 0, s_out_g: 0, s_tr: 0, s_in_o: 0, s_out_o: 0, s_tot: 0,
                              pos: 0, grand: 0
                          });
                          return (
                            <tr className="bg-gray-800 text-white font-bold">
                                <td className="p-2 border border-gray-600 sticky left-0 bg-gray-800">TOTAL {year}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.b_in_g)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.b_out_g)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.b_tr)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.b_in_o)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.b_out_o)}</td>
                                <td className={`p-2 border border-gray-600 ${yearTotals.b_tot < 0 ? 'text-red-300' : 'text-green-300'}`}>{formatCcy(yearTotals.b_tot)}</td>

                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.s_in_g)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.s_out_g)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.s_tr)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.s_in_o)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.s_out_o)}</td>
                                <td className={`p-2 border border-gray-600 ${yearTotals.s_tot < 0 ? 'text-red-300' : 'text-green-300'}`}>{formatCcy(yearTotals.s_tot)}</td>

                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.pos)}</td>
                                <td className="p-2 border border-gray-600">{formatCcy(yearTotals.grand)}</td>
                            </tr>
                          );
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
      ))}
    </div>
  );
};

export default ComplexReport;