
import { BatchSubmissionForm } from '@/components/inventory/BatchSubmissionForm';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Link } from 'react-router-dom';
import { Send, Package } from 'lucide-react';

const BatchSubmission = () => {
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
                  <Send className="w-6 h-6" />
                  Submit New Batch
                </h1>
                <p className="text-white/60">Submit inventory batches for supervisor approval</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Package className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-blue-300 font-medium">Batch Submission Process</p>
              <p className="text-blue-200/80 text-sm">
                Submit new inventory batches with product details and supplier information. 
                Batch numbers are auto-generated and require supervisor approval.
              </p>
            </div>
          </div>
        </div>
        
        <BatchSubmissionForm />
      </div>
    </div>
  );
};

export default BatchSubmission;
