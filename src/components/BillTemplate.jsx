import React from 'react';

const BillTemplate = ({ bill, refProp, className }) => {
    if (!bill) return null;

    const subtotal = bill.items.reduce((sum, item) => sum + ((item.price || item.price_at_sale) * (item.count || item.quantity)), 0);
    const discountValue = bill.discount_value || bill.discountValue || 0;
    const hasDiscount = discountValue > 0;

    const customerName = bill.customer?.name || bill.customer_name || 'Walk-in';
    const customerPhone = bill.customer?.phone || bill.customer_phone || '';
    const sellerName = bill.customer?.seller_name || bill.seller_name || bill.employee_name || 'Staff';

    return (
        <div ref={refProp} className={`${className || 'hidden print:block'} bg-white text-black w-[210mm] min-h-[297mm] p-[15mm] mx-auto relative flex flex-col font-serif shadow-xl print:shadow-none print:w-full print:h-full`}>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Oil Inventory</h1>
                <p className="text-sm text-gray-600">123 Business Road, City, State</p>
                <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
            </div>

            <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

            <div className="flex justify-between mb-4 text-sm">
                <div>
                    <p><span className="font-bold">Bill No:</span> {bill.id || 'N/A'}</p>
                    <p><span className="font-bold">Date:</span> {new Date(bill.date).toLocaleString()}</p>
                    <p><span className="font-bold">Mode:</span> {bill.payment_mode || bill.paymentMode || 'Cash'}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-bold">Customer:</span> {customerName}</p>
                    <p><span className="font-bold">Phone:</span> {customerPhone}</p>
                    <p><span className="font-bold">Seller:</span> {sellerName}</p>
                </div>
            </div>

            <table className="w-full text-left mb-6 border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="py-2 text-sm uppercase">Item</th>
                        <th className="py-2 text-center text-sm uppercase">Qty</th>
                        <th className="py-2 text-right text-sm uppercase">Price</th>
                        <th className="py-2 text-right text-sm uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 border-dashed">
                            <td className="py-2 text-sm">{item.name || item.product_name}</td>
                            <td className="py-2 text-center text-sm">{item.count || item.quantity}</td>
                            <td className="py-2 text-right text-sm">₹{(item.price || item.price_at_sale).toFixed(2)}</td>
                            <td className="py-2 text-right text-sm font-medium">₹{((item.price || item.price_at_sale) * (item.count || item.quantity)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-6">
                <div className="w-1/2">
                    <div className="flex justify-between py-1 text-sm">
                        <span className="font-bold">Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {hasDiscount && (
                        <div className="flex justify-between py-1 text-sm text-gray-600">
                            <span>Discount ({(bill.discount_type || bill.discountType) === 'percent' ? `${discountValue}%` : '₹'}):</span>
                            <span>-₹{(subtotal - bill.total_amount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-1 border-t-2 border-black mt-2">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="font-bold text-xl">₹{bill.total_amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-4 text-center mt-auto pb-4">
                <p className="font-bold text-lg mb-1">Thank You!</p>
                <p className="text-sm text-gray-500">Please visit again.</p>
            </div>
        </div>
    );
};

export default BillTemplate;
