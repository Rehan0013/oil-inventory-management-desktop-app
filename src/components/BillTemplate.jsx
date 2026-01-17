import React from 'react';

const BillTemplate = ({ bill, settings, refProp, className }) => {
    if (!bill) return null;

    const { businessName, addressLine1, addressLine2, phone, gstin } = settings || {};

    const subtotal = bill.items.reduce((sum, item) => sum + ((item.price || item.price_at_sale) * (item.count || item.quantity)), 0);
    const discountValue = bill.discount_value || bill.discountValue || 0;
    const discountType = bill.discount_type || bill.discountType || 'amount';
    const taxRate = bill.tax_rate !== undefined ? bill.tax_rate : (bill.taxRate || 0);
    const taxAmount = bill.tax_amount !== undefined ? bill.tax_amount : (bill.taxAmount || 0);

    const hasDiscount = discountValue > 0;
    const hasTax = taxRate > 0;

    const customerName = bill.customer?.name || bill.customer_name || 'Walk-in';
    const customerPhone = bill.customer?.phone || bill.customer_phone || '';
    const sellerName = bill.customer?.seller_name || bill.seller_name || bill.employee_name || 'Staff';

    // Normalize payment details (handle both DB snake_case and local object structure)
    const paymentModeStr = (typeof bill.paymentMode === 'object' ? bill.paymentMode.mode : bill.payment_mode || bill.paymentMode) || 'Cash';
    const paymentStatus = bill.payment_status || (bill.paymentMode && bill.paymentMode.status) || 'Paid';
    const amountPaid = bill.amount_paid !== undefined ? bill.amount_paid : (bill.paymentMode && bill.paymentMode.amountPaid) || 0;
    const balanceDue = bill.balance_due !== undefined ? bill.balance_due : (bill.paymentMode && bill.paymentMode.balanceDue) || 0;

    return (
        <div ref={refProp} className={`${className || 'hidden print:block'} bg-white text-black w-[79mm] min-h-[100mm] p-2 mx-auto relative flex flex-col font-sans shadow-xl print:shadow-none print:w-full print:h-full text-[10px] leading-tight`}>
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold uppercase tracking-wide mb-1">{businessName || 'Oilstro'}</h1>
                <p className="text-[10px] text-gray-800">{addressLine1 || '123 Business Road'}</p>
                <p className="text-[10px] text-gray-800">{addressLine2 || 'City, State'}</p>
                <p className="text-[10px] text-gray-800">Ph: {phone || '(555) 123-4567'}</p>
                {gstin && <p className="text-[10px] text-gray-800">GSTIN: {gstin}</p>}
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            <div className="flex justify-between mb-2 text-[10px]">
                <div className="space-y-0.5">
                    <p>Bill: <span className="font-bold">{bill.id || 'N/A'}</span></p>
                    <p>{new Date(bill.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    <p className="truncate w-24">Mode: {paymentModeStr}</p>
                </div>
                <div className="text-right space-y-0.5">
                    <p className="font-bold truncate w-24">{customerName}</p>
                    <p>{customerPhone}</p>
                    <p>Seller: {sellerName}</p>
                </div>
            </div>

            <table className="w-full text-left mb-2 border-collapse">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-1 text-[10px] uppercase font-bold text-left w-[35%]">Item</th>
                        <th className="py-1 text-[10px] uppercase font-bold text-center w-[20%]">Batch</th>
                        <th className="py-1 text-center text-[10px] uppercase font-bold w-[10%]">Q</th>
                        <th className="py-1 text-right text-[10px] uppercase font-bold w-[15%]">Rate</th>
                        <th className="py-1 text-right text-[10px] uppercase font-bold w-[20%]">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-300 border-dashed">
                            <td className="py-1 text-[10px] break-words pr-1 align-top">{item.name || item.product_name}</td>
                            <td className="py-1 text-center text-[9px] font-mono align-top">{item.batch_number || item.batchNumber || '-'}</td>
                            <td className="py-1 text-center text-[10px] align-top">{item.count || item.quantity}</td>
                            <td className="py-1 text-right text-[10px] align-top">{parseFloat(item.price || item.price_at_sale).toFixed(0)}</td>
                            <td className="py-1 text-right text-[10px] font-bold align-top">{((item.price || item.price_at_sale) * (item.count || item.quantity)).toFixed(0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-4">
                <div className="w-full">
                    <div className="flex justify-between py-0.5 text-[10px]">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {hasDiscount && (
                        <div className="flex justify-between py-0.5 text-[10px] text-gray-600">
                            <span>Disc ({discountType === 'percent' ? `${discountValue}%` : '₹'}):</span>
                            <span>-₹{(subtotal - (bill.total_amount - taxAmount)).toFixed(2)}</span>
                        </div>
                    )}

                    {/* Tax Breakdown */}
                    {hasTax && (
                        <>
                            <div className="flex justify-between py-0.5 text-[10px]">
                                <span>Taxable Amount:</span>
                                <span>₹{(bill.total_amount - taxAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-0.5 text-[10px] text-gray-600">
                                <span>CGST ({(taxRate / 2).toFixed(1)}%):</span>
                                <span>₹{(taxAmount / 2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-0.5 text-[10px] text-gray-600">
                                <span>SGST ({(taxRate / 2).toFixed(1)}%):</span>
                                <span>₹{(taxAmount / 2).toFixed(2)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between py-1 border-t border-black mt-1">
                        <span className="font-bold text-base">Total:</span>
                        <span className="font-bold text-base">₹{bill.total_amount.toFixed(2)}</span>
                    </div>
                    {(paymentStatus === 'Partial' || paymentStatus === 'Unpaid') && (
                        <div className="mt-1 pt-1 border-t border-dotted border-gray-400">
                            <div className="flex justify-between text-[10px]">
                                <span>Paid:</span>
                                <span>₹{amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-red-600">
                                <span>Due:</span>
                                <span>₹{balanceDue.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {bill.payments && bill.payments.length > 0 && (
                <div className="mb-4">
                    <p className="font-bold text-[10px] border-b border-gray-400 mb-1 pb-0.5">History</p>
                    <table className="w-full text-left text-[9px]">
                        <tbody>
                            {bill.payments.map((pay, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-0.5">{new Date(pay.date).toLocaleDateString()}</td>
                                    <td className="py-0.5">{pay.payment_mode || 'Cash'}</td>
                                    <td className="py-0.5 text-right">₹{parseFloat(pay.amount).toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="border-t border-dashed border-gray-400 pt-2 text-center mt-auto pb-2">
                <p className="font-bold text-sm mb-0.5">Thank You!</p>
                <p className="text-[10px] text-gray-500">Visit Again</p>
            </div>
        </div>
    );
};

export default BillTemplate;
