
import { UserMenu } from '@/components/navigation/UserMenu';
import { BackButton } from '@/components/navigation/BackButton';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Plus, ChevronDown, Wrench, History } from 'lucide-react';
import { UnapprovedBatchesReport } from '@/components/inventory/UnapprovedBatchesReport';
import ReorderReportCard from '@/components/reports/ReorderReportCard';
import { BatchApprovalReport } from '@/components/reports/BatchApprovalReport';
import { ProductMovementReport } from '@/components/reports/ProductMovementReport';
import { BatchListReport } from '@/components/reports/BatchListReport';
import UnreturnedToolsReport from '@/components/tools/UnreturnedToolsReport';
import ToolEventsReport from '@/components/tools/ToolEventsReport';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<string>('reminders');

  const reportOptions = [
    { value: 'reminders', label: 'Unapproved Batches - Reminders', icon: AlertTriangle },
    { value: 'reorder', label: 'Reorder Report - Low Stock Items', icon: FileText },
    { value: 'approval', label: 'Batch Approval Report', icon: AlertTriangle },
    { value: 'movement', label: 'Product Movement Chart', icon: FileText },
    { value: 'batches', label: 'Batch List Report', icon: FileText },
    { value: 'tools-unreturned', label: 'Tools - Unreturned (Not Returned)', icon: Wrench },
    { value: 'tools-events', label: 'Tools - Activity Log', icon: History }
  ];

  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 'reminders':
        return <UnapprovedBatchesReport />;
      case 'reorder':
        return <ReorderReportCard />;
      case 'approval':
        return <BatchApprovalReport />;
      case 'movement':
        return <ProductMovementReport />;
      case 'batches':
        return <BatchListReport />;
      case 'tools-unreturned':
        return <UnreturnedToolsReport />;
      case 'tools-events':
        return <ToolEventsReport />;
      default:
        return <UnapprovedBatchesReport />;
    }
  };

  const selectedReportData = reportOptions.find(option => option.value === selectedReport);

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Report Selection Dropdown */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-white font-medium">Select Report:</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[300px] justify-between bg-surface-dark/50 border-white/20 text-white hover:bg-white/10">
                <div className="flex items-center gap-2">
                  {selectedReportData && <selectedReportData.icon className="w-4 h-4" />}
                  {selectedReportData?.label || 'Select a report'}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="min-w-[300px] bg-surface-dark border-white/20" 
              align="start"
            >
              {reportOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setSelectedReport(option.value)}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <option.icon className="w-4 h-4 mr-2" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Selected Report Content */}
        {renderSelectedReport()}
      </div>
    </div>
  );
};

export default Reports;
