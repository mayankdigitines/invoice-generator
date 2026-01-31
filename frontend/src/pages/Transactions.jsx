import { useState, useEffect } from 'react';
import api from '../api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendModal, setExtendModal] = useState({
    open: false,
    businessId: null,
  });
  const [extensionData, setExtensionData] = useState({ days: 30, remark: '' });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/subscriptions/transactions');
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions/extend', {
        businessId: extendModal.businessId,
        days: extensionData.days,
        remark: extensionData.remark,
      });
      setExtendModal({ open: false, businessId: null });
      fetchTransactions();
      alert('Extended successfully');
    } catch (error) {
      alert('Failed to extend');
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Transaction History & Subscriptions
      </h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plan/Remark</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn._id}>
                  <TableCell>
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {txn.businessId?.name} <br />
                    <span className="text-xs text-gray-500">
                      {txn.businessId?.email}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {txn.type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    {txn.planSnapshot?.name || txn.remark}
                    {txn.planSnapshot?.durationType &&
                      ` (${txn.planSnapshot.durationType})`}
                  </TableCell>
                  <TableCell>₹{txn.amount}</TableCell>
                  <TableCell>{txn.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExtendModal({
                          open: true,
                          businessId: txn.businessId._id,
                        })
                      }
                    >
                      Extend
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={extendModal.open}
        onClose={() => setExtendModal({ ...extendModal, open: false })}
        title="Extend Subscription Manually"
      >
        <form onSubmit={handleExtend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Days to Extend
            </label>
            <Input
              type="number"
              value={extensionData.days}
              onChange={(e) =>
                setExtensionData({ ...extensionData, days: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Remark</label>
            <Input
              value={extensionData.remark}
              onChange={(e) =>
                setExtensionData({ ...extensionData, remark: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Confirm Extension
          </Button>
        </form>
      </Modal>
    </div>
  );
}
