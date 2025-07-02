
import { UserMenu } from '@/components/navigation/UserMenu';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Plus } from 'lucide-react';
import { UnapprovedBatchesReport } from '@/components/inventory/UnapprovedBatchesReport';
import { Button } from '@/components/ui/button';

const Reports = () => {
  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-white/60 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Reports & Reminders
                </h1>
                <p className="text-white/60">View system reports and pending approvals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/batch-submission">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Batch
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <UnapprovedBatchesReport />
      </div>
    </div>
  );
};

export default Reports;
