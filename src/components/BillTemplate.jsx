import React from 'react';

const BillTemplate = ({ bill, settings, refProp, className }) => {
    if (!bill) return null;

    const { businessName, addressLine1, addressLine2, phone, gstin } = settings || {};

    const subtotal = bill.items.reduce((sum, item) => sum + ((item.price || item.price_at_sale) * (item.count || item.quantity)), 0);

    const isItemized = bill.calculationMode === 'itemized' || bill.calculation_mode === 'itemized';

    // Calculate aggregated totals
    let finalDiscountDisplay = 0;
    let finalTaxDisplay = 0;

    if (isItemized) {
        bill.items.forEach(item => {
            const qty = item.count || item.quantity || 0;
            const price = item.price || item.price_at_sale || 0;
            const itemTotal = price * qty;
            const dVal = parseFloat(item.discountValue !== undefined ? item.discountValue : (item.discount_value !== undefined ? item.discount_value : 0));
            const dType = item.discountType || item.discount_type || 'amount';
            const itemDisc = dType === 'percent' ? (itemTotal * dVal / 100) : dVal;
            finalDiscountDisplay += itemDisc;

            const tRate = parseFloat(item.taxRate !== undefined ? item.taxRate : (item.tax_rate !== undefined ? item.tax_rate : 0));
            finalTaxDisplay += (itemTotal - itemDisc) * (tRate / 100);
        });
    } else {
        // Global Mode
        const savedDiscountAmt = bill.discount_amount !== undefined ? bill.discount_amount : (bill.discountAmount || 0);
        if (savedDiscountAmt > 0) {
            finalDiscountDisplay = parseFloat(savedDiscountAmt);
        } else {
            const dVal = parseFloat(bill.discountValue !== undefined ? bill.discountValue : (bill.discount_value !== undefined ? bill.discount_value : 0));
            const dType = bill.discountType || bill.discount_type || 'amount';
            finalDiscountDisplay = dType === 'percent' ? (subtotal * dVal / 100) : dVal;
        }

        // Trust tax_amount if it exists as a saved absolute value, otherwise calculate from rate
        const savedTaxAmt = bill.tax_amount !== undefined ? bill.tax_amount : (bill.taxAmount || 0);
        if (savedTaxAmt > 0) {
            finalTaxDisplay = parseFloat(savedTaxAmt);
        } else {
            const tRate = parseFloat(bill.tax_rate !== undefined ? bill.tax_rate : (bill.taxRate || 0));
            finalTaxDisplay = (subtotal - finalDiscountDisplay) * (tRate / 100);
        }
    }

    const finalDiscount = finalDiscountDisplay;
    const finalTax = finalTaxDisplay;

    // Global Settings (for fallback/display in table if needed)
    const globalDiscountVal = bill.discount_value || bill.discountValue || 0;
    const globalDiscountType = bill.discount_type || bill.discountType || 'amount';
    const globalTaxRate = bill.tax_rate !== undefined ? bill.tax_rate : (bill.taxRate || 0);

    const customerName = bill.customer?.name || bill.customer_name || 'Walk-in';
    const customerPhone = bill.customer?.phone || bill.customer_phone || '';
    const sellerName = bill.customer?.seller_name || bill.seller_name || bill.employee_name || 'Staff';

    // Normalize payment details
    const paymentModeStr = (typeof bill.paymentMode === 'object' ? bill.paymentMode.mode : bill.payment_mode || bill.paymentMode) || 'Cash';
    const paymentStatus = bill.payment_status || (bill.paymentMode && bill.paymentMode.status) || 'Paid';
    const amountPaid = bill.amount_paid !== undefined ? bill.amount_paid : (bill.paymentMode && bill.paymentMode.amountPaid) || 0;
    const balanceDue = bill.balance_due !== undefined ? bill.balance_due : (bill.paymentMode && bill.paymentMode.balanceDue) || 0;

    return (
        <div ref={refProp} className={`${className || 'hidden print:block'} bg-white text-black w-[79mm] min-h-[100mm] p-2 mx-auto relative flex flex-col font-sans shadow-xl print:shadow-none print:w-full print:h-full text-[10px] leading-tight`}>
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold uppercase tracking-wide mb-1">{businessName || ''}</h1>
                <p className="text-[10px] text-gray-800">{addressLine1 || ''}</p>
                <p className="text-[10px] text-gray-800">{addressLine2 || ''}</p>
                <p className="text-[10px] text-gray-800">{phone ? `Ph: ${phone}` : ''}</p>
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
                        <th className="py-1 text-[10px] uppercase font-bold text-left w-[30%]">Item</th>
                        <th className="py-1 text-[10px] uppercase font-bold text-center w-[15%]">Batch</th>
                        <th className="py-1 text-center text-[10px] uppercase font-bold w-[10%]">Q</th>
                        <th className="py-1 text-right text-[10px] uppercase font-bold w-[15%]">Rate</th>
                        {isItemized ? (
                            <>
                                <th className="py-1 text-center text-[8px] uppercase font-bold w-[10%]">Disc</th>
                                <th className="py-1 text-center text-[8px] uppercase font-bold w-[10%]">GST</th>
                            </>
                        ) : null}
                        <th className={`py-1 text-right text-[10px] uppercase font-bold ${isItemized ? 'w-[10%]' : 'w-[20%]'}`}>Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, idx) => {
                        const basePrice = (item.price || item.price_at_sale) * (item.count || item.quantity);

                        // Determine what to show for Tax/Disc
                        let displayTaxRate = 0;
                        let displayDisc = null;

                        let finalItemAmount = basePrice;

                        if (isItemized) {
                            displayTaxRate = item.taxRate || 0;
                            if (item.discountValue > 0) {
                                displayDisc = item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`;

                                // Calculate Discount Amount
                                const discountAmount = item.discountType === 'percent'
                                    ? basePrice * (parseFloat(item.discountValue) / 100)
                                    : parseFloat(item.discountValue);

                                finalItemAmount = Math.max(0, basePrice - discountAmount);
                            }

                            // Calculate Tax Amount on discounted price
                            if (displayTaxRate > 0) {
                                const taxAmount = finalItemAmount * (displayTaxRate / 100);
                                finalItemAmount += taxAmount;
                            }

                        } else {
                            // Global Mode: Show effective rates if they exist
                            // Amount column stays as Base Price (Price * Qty)
                            displayTaxRate = globalTaxRate || 0;
                            if (globalDiscountVal > 0) {
                                displayDisc = globalDiscountType === 'percent' ? `${globalDiscountVal}%` : `(Global)`;
                            }
                        }

                        return (
                            <tr key={idx} className="border-b border-gray-300 border-dashed">
                                <td className="py-1 text-[10px] break-words pr-1 align-top">
                                    {item.name || item.product_name}
                                    {!isItemized && (displayTaxRate > 0 || displayDisc) && (
                                        <div className="text-[8px] text-gray-500 flex flex-wrap gap-1">
                                            {displayTaxRate > 0 && <span>GST: {displayTaxRate}%</span>}
                                            {displayDisc && <span>Disc: {displayDisc}</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="py-1 text-center text-[9px] font-mono align-top">{item.batch_number || item.batchNumber || '-'}</td>
                                <td className="py-1 text-center text-[10px] align-top">{item.count || item.quantity}</td>
                                <td className="py-1 text-right text-[10px] align-top">{parseFloat(item.price || item.price_at_sale).toFixed(0)}</td>

                                {isItemized && (
                                    <>
                                        <td className="py-1 text-center text-[9px] align-top">
                                            {displayDisc || '-'}
                                        </td>
                                        <td className="py-1 text-center text-[9px] align-top">
                                            {displayTaxRate > 0 ? `${displayTaxRate}%` : '-'}
                                        </td>
                                    </>
                                )}

                                <td className="py-1 text-right text-[10px] font-bold align-top">{finalItemAmount.toFixed(0)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="flex justify-end mb-4">
                <div className="w-full">
                    <div className="flex justify-between py-0.5 text-[10px]">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {finalDiscount > 0 && (
                        <div className="flex justify-between py-0.5 text-[10px] text-gray-600">
                            <span>Discount:</span>
                            <span>-₹{parseFloat(finalDiscount).toFixed(2)}</span>
                        </div>
                    )}

                    {finalTax > 0 && (
                        <>
                            <div className="flex justify-between py-0.5 text-[10px]">
                                <span>Taxable Amount:</span>
                                <span>₹{(bill.total_amount - finalTax).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-0.5 text-[10px] text-gray-600">
                                <span>Total GST:</span>
                                <span>₹{parseFloat(finalTax).toFixed(2)}</span>
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
