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

export default function MyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTransactions = async () => {
      try {
        const { data } = await api.get('/subscriptions/my-transactions');
        setTransactions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyTransactions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Subscription History</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn._id}>
                  <TableCell>
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {txn.type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{txn.planSnapshot?.name || txn.remark}</TableCell>
                  <TableCell>₹{txn.amount}</TableCell>
                  <TableCell>{txn.status}</TableCell>
                  <TableCell>
                    {txn.startDate &&
                      `${new Date(txn.startDate).toLocaleDateString()} - ${new Date(txn.endDate).toLocaleDateString()}`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
