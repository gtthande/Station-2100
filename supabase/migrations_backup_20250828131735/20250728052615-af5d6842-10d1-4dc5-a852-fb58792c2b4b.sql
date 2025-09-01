-- Create job_cards table
create table if not exists job_cards (
  jobcardid serial primary key,
  customerid integer,
  customername varchar(100),
  custaddress varchar(100),
  custphone varchar(50),
  custfax varchar(50),
  category varchar(50),
  date_opened timestamp,
  date_closed timestamp,
  description varchar(200),
  parts_cost money,
  service_cost money,
  empid integer,
  remarks varchar(200),
  custinvno integer,
  parts_price money,
  assignedto integer,
  preparedby varchar(100),
  preparedate timestamp,
  approvedby varchar(100),
  approvedate timestamp,
  dateforwarded timestamp,
  aircraft_regno varchar(100),
  subjobcardid varchar(50),
  accomponentserno varchar(50),
  requisitiondate timestamp,
  requestedby bigint,
  receivedby bigint,
  receiveddate timestamp,
  authorisedby bigint,
  authoriseddate timestamp,
  issuedby bigint,
  issueddate timestamp,
  stockcardpostedby bigint,
  stockcardposteddate timestamp,
  manual_jobno integer,
  service_fitting_cost money,
  closed boolean,
  whbnc_cost money,
  whbnc_fitting money,
  close_invoice varchar(50),
  prepaid boolean,
  printed boolean,
  ac_aproved boolean,
  oss_approved boolean,
  consumables_approved boolean,
  ac_aproved_by varchar(100),
  oss_approved_by varchar(100),
  consumables_approved_by varchar(100),
  ac_forwarddate timestamp,
  oss_forwarddate timestamp,
  whb_forwarddate timestamp,
  ac_approvedate timestamp,
  oss_approvedate timestamp,
  whb_approvedate timestamp,
  whb_aproved_by varchar(50),
  whb_aproved boolean,
  ac_no integer,
  oss_no integer,
  whbnc_no integer
);

-- Create jobcard_parts table
create table if not exists jobcard_parts (
  jobcardid integer references job_cards(jobcardid),
  partno integer not null,
  batch_no varchar(50) not null,
  department_id numeric(10, 0) not null,
  quantity numeric(18, 4),
  buying_price money,
  fitting_price money,
  part_date timestamp,
  empno varchar(50),
  qty_requested numeric(18, 4),
  cancelled boolean,
  prepaid_dets varchar(50),
  uom varchar(50),
  verified boolean,
  description varchar(50),
  staffname varchar(50),
  issuedby varchar(50),
  issuecode varchar(50),
  type varchar(50)
);

-- Enable RLS on both tables
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobcard_parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_cards
CREATE POLICY "Users can view all job cards" ON job_cards FOR SELECT USING (true);
CREATE POLICY "Users can create job cards" ON job_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update job cards" ON job_cards FOR UPDATE USING (true);
CREATE POLICY "Users can delete job cards" ON job_cards FOR DELETE USING (true);

-- Create RLS policies for jobcard_parts
CREATE POLICY "Users can view all jobcard parts" ON jobcard_parts FOR SELECT USING (true);
CREATE POLICY "Users can create jobcard parts" ON jobcard_parts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update jobcard parts" ON jobcard_parts FOR UPDATE USING (true);
CREATE POLICY "Users can delete jobcard parts" ON jobcard_parts FOR DELETE USING (true);