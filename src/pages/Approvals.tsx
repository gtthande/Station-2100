
import { BatchApprovalList } from '@/components/inventory/BatchApprovalList';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Link } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';

const Approvals = () => {
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
                  <CheckCircle className="w-6 h-6" />
                  Batch Approvals & Job Allocation
                </h1>
                <p className="text-white/60">Review and approve incoming parts, allocate to jobs</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <BatchApprovalList />
      </div>
    </div>
  );
};

export default Approvals;
