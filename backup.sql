--
-- PostgreSQL database dump
--

\restrict EgYEdTGM2VG4neqNB2pNxYDcj711RcEOqS1sEBcdDeJ8h0LUEXYZvmIKIEFt8Cr

-- Dumped from database version 15.16 (Debian 15.16-0+deb12u1)
-- Dumped by pg_dump version 15.16 (Debian 15.16-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    org_id integer,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO taskadmin;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.companies_id_seq OWNER TO taskadmin;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    org_id integer,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO taskadmin;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departments_id_seq OWNER TO taskadmin;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: designations; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.designations (
    id integer NOT NULL,
    org_id integer,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.designations OWNER TO taskadmin;

--
-- Name: designations_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.designations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.designations_id_seq OWNER TO taskadmin;

--
-- Name: designations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.designations_id_seq OWNED BY public.designations.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    org_id integer,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO taskadmin;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.locations_id_seq OWNER TO taskadmin;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: meeting_members; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.meeting_members (
    id integer NOT NULL,
    meeting_id integer,
    user_id integer
);


ALTER TABLE public.meeting_members OWNER TO taskadmin;

--
-- Name: meeting_members_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.meeting_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_members_id_seq OWNER TO taskadmin;

--
-- Name: meeting_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.meeting_members_id_seq OWNED BY public.meeting_members.id;


--
-- Name: meeting_mom; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.meeting_mom (
    id integer NOT NULL,
    meeting_id integer,
    user_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meeting_mom OWNER TO taskadmin;

--
-- Name: meeting_mom_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.meeting_mom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_mom_id_seq OWNER TO taskadmin;

--
-- Name: meeting_mom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.meeting_mom_id_seq OWNED BY public.meeting_mom.id;


--
-- Name: meeting_updates; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.meeting_updates (
    id integer NOT NULL,
    meeting_id integer,
    user_id integer,
    remark text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meeting_updates OWNER TO taskadmin;

--
-- Name: meeting_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.meeting_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_updates_id_seq OWNER TO taskadmin;

--
-- Name: meeting_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.meeting_updates_id_seq OWNED BY public.meeting_updates.id;


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.meetings (
    id integer NOT NULL,
    org_id integer,
    meeting_number character varying(20),
    title character varying(500) NOT NULL,
    description text,
    owner_id integer,
    meeting_date timestamp without time zone,
    location_id integer,
    virtual_link text,
    status character varying(20) DEFAULT 'open'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    project_id integer,
    CONSTRAINT meetings_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'recurring'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.meetings OWNER TO taskadmin;

--
-- Name: meetings_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.meetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meetings_id_seq OWNER TO taskadmin;

--
-- Name: meetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.meetings_id_seq OWNED BY public.meetings.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    org_id integer,
    user_id integer,
    type character varying(50),
    title character varying(255),
    message text,
    is_read boolean DEFAULT false,
    ref_id integer,
    ref_type character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO taskadmin;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO taskadmin;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    domain character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE public.organizations OWNER TO taskadmin;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organizations_id_seq OWNER TO taskadmin;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO taskadmin;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_reset_tokens_id_seq OWNER TO taskadmin;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.project_members (
    id integer NOT NULL,
    project_id integer,
    user_id integer
);


ALTER TABLE public.project_members OWNER TO taskadmin;

--
-- Name: project_members_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.project_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_members_id_seq OWNER TO taskadmin;

--
-- Name: project_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.project_members_id_seq OWNED BY public.project_members.id;


--
-- Name: project_updates; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.project_updates (
    id integer NOT NULL,
    project_id integer,
    user_id integer,
    remark text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_updates OWNER TO taskadmin;

--
-- Name: project_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.project_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_updates_id_seq OWNER TO taskadmin;

--
-- Name: project_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.project_updates_id_seq OWNED BY public.project_updates.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    org_id integer,
    project_number character varying(20),
    title character varying(500) NOT NULL,
    description text,
    owner_id integer,
    department_id integer,
    location_id integer,
    start_date date,
    end_date date,
    priority character varying(10) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT projects_priority_check CHECK (((priority)::text = ANY ((ARRAY['critical'::character varying, 'high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['planning'::character varying, 'active'::character varying, 'on_hold'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.projects OWNER TO taskadmin;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO taskadmin;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: task_activities; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.task_activities (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    action character varying(100) NOT NULL,
    old_value text,
    new_value text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_activities OWNER TO taskadmin;

--
-- Name: task_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.task_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_activities_id_seq OWNER TO taskadmin;

--
-- Name: task_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.task_activities_id_seq OWNED BY public.task_activities.id;


--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.task_attachments (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    filename character varying(255) NOT NULL,
    original_name character varying(255),
    file_path text,
    file_size integer,
    file_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_attachments OWNER TO taskadmin;

--
-- Name: task_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.task_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_attachments_id_seq OWNER TO taskadmin;

--
-- Name: task_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.task_attachments_id_seq OWNED BY public.task_attachments.id;


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.task_comments (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_comments OWNER TO taskadmin;

--
-- Name: task_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.task_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_comments_id_seq OWNER TO taskadmin;

--
-- Name: task_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.task_comments_id_seq OWNED BY public.task_comments.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    org_id integer,
    task_number character varying(20),
    category character varying(20) DEFAULT 'task'::character varying,
    title character varying(500) NOT NULL,
    description text,
    assigned_by integer,
    assigned_to integer,
    department_id integer,
    location_id integer,
    start_date date,
    due_date date,
    priority character varying(10) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'open'::character varying,
    resolution_summary text,
    completion_date date,
    tags text[],
    estimated_effort numeric(5,2),
    actual_effort numeric(5,2),
    is_pinned boolean DEFAULT false,
    parent_task_id integer,
    meeting_id integer,
    project_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_category_check CHECK (((category)::text = ANY ((ARRAY['task'::character varying, 'subtask'::character varying, 'meeting'::character varying, 'project'::character varying])::text[]))),
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['critical'::character varying, 'high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'on_hold'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.tasks OWNER TO taskadmin;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tasks_id_seq OWNER TO taskadmin;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: taskadmin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    org_id integer,
    employee_code character varying(50),
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    mobile character varying(20),
    company_id integer,
    location_id integer,
    department_id integer,
    designation_id integer,
    manager_id integer,
    role character varying(20) DEFAULT 'user'::character varying,
    status character varying(10) DEFAULT 'active'::character varying,
    force_password_change boolean DEFAULT true,
    avatar_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_superadmin boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'manager'::character varying, 'user'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO taskadmin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: taskadmin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO taskadmin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taskadmin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: designations id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.designations ALTER COLUMN id SET DEFAULT nextval('public.designations_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: meeting_members id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_members ALTER COLUMN id SET DEFAULT nextval('public.meeting_members_id_seq'::regclass);


--
-- Name: meeting_mom id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_mom ALTER COLUMN id SET DEFAULT nextval('public.meeting_mom_id_seq'::regclass);


--
-- Name: meeting_updates id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_updates ALTER COLUMN id SET DEFAULT nextval('public.meeting_updates_id_seq'::regclass);


--
-- Name: meetings id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings ALTER COLUMN id SET DEFAULT nextval('public.meetings_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: project_members id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_members ALTER COLUMN id SET DEFAULT nextval('public.project_members_id_seq'::regclass);


--
-- Name: project_updates id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_updates ALTER COLUMN id SET DEFAULT nextval('public.project_updates_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: task_activities id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_activities ALTER COLUMN id SET DEFAULT nextval('public.task_activities_id_seq'::regclass);


--
-- Name: task_attachments id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_attachments ALTER COLUMN id SET DEFAULT nextval('public.task_attachments_id_seq'::regclass);


--
-- Name: task_comments id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_comments ALTER COLUMN id SET DEFAULT nextval('public.task_comments_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.companies (id, org_id, name, created_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.departments (id, org_id, name, created_at) FROM stdin;
\.


--
-- Data for Name: designations; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.designations (id, org_id, name, created_at) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.locations (id, org_id, name, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_members; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.meeting_members (id, meeting_id, user_id) FROM stdin;
\.


--
-- Data for Name: meeting_mom; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.meeting_mom (id, meeting_id, user_id, content, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_updates; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.meeting_updates (id, meeting_id, user_id, remark, created_at) FROM stdin;
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.meetings (id, org_id, meeting_number, title, description, owner_id, meeting_date, location_id, virtual_link, status, created_by, created_at, updated_at, project_id) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.notifications (id, org_id, user_id, type, title, message, is_read, ref_id, ref_type, created_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.organizations (id, name, domain, created_at, status) FROM stdin;
1	Demo Corp	democorp.com	2026-03-09 07:59:12.138998	active
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.project_members (id, project_id, user_id) FROM stdin;
\.


--
-- Data for Name: project_updates; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.project_updates (id, project_id, user_id, remark, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.projects (id, org_id, project_number, title, description, owner_id, department_id, location_id, start_date, end_date, priority, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_activities; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.task_activities (id, task_id, user_id, action, old_value, new_value, created_at) FROM stdin;
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.task_attachments (id, task_id, user_id, filename, original_name, file_path, file_size, file_type, created_at) FROM stdin;
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.task_comments (id, task_id, user_id, comment, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.tasks (id, org_id, task_number, category, title, description, assigned_by, assigned_to, department_id, location_id, start_date, due_date, priority, status, resolution_summary, completion_date, tags, estimated_effort, actual_effort, is_pinned, parent_task_id, meeting_id, project_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: taskadmin
--

COPY public.users (id, org_id, employee_code, name, email, password_hash, mobile, company_id, location_id, department_id, designation_id, manager_id, role, status, force_password_change, avatar_url, created_at, updated_at, is_superadmin) FROM stdin;
1	1	\N	Admin User	admin@democorp.com	$2a$12$wON1RzwVRwW2WngUaCjzwOqkD0hCJhdQlOimkE2zPGu4zdJGVBdKe	\N	\N	\N	\N	\N	\N	owner	active	f	\N	2026-03-09 07:59:12.138998	2026-03-09 07:59:12.138998	f
2	1	\N	Super Admin	superadmin@taskflow.com	$2a$12$eDLrOfCb58fZVUEyHk0g..HEqmpBg.masAviiyqZKWDxpXp7XSCNy	\N	\N	\N	\N	\N	\N	owner	active	f	\N	2026-03-09 07:59:12.837616	2026-03-09 07:59:12.837616	t
\.


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.companies_id_seq', 1, false);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- Name: designations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.designations_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.locations_id_seq', 1, false);


--
-- Name: meeting_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.meeting_members_id_seq', 1, false);


--
-- Name: meeting_mom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.meeting_mom_id_seq', 1, false);


--
-- Name: meeting_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.meeting_updates_id_seq', 1, false);


--
-- Name: meetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.meetings_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: project_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.project_members_id_seq', 1, false);


--
-- Name: project_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.project_updates_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- Name: task_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.task_activities_id_seq', 1, false);


--
-- Name: task_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.task_attachments_id_seq', 1, false);


--
-- Name: task_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.task_comments_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taskadmin
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: companies companies_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_org_id_name_key UNIQUE (org_id, name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: departments departments_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_org_id_name_key UNIQUE (org_id, name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: designations designations_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_org_id_name_key UNIQUE (org_id, name);


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_org_id_name_key UNIQUE (org_id, name);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: meeting_members meeting_members_meeting_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_meeting_id_user_id_key UNIQUE (meeting_id, user_id);


--
-- Name: meeting_members meeting_members_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_pkey PRIMARY KEY (id);


--
-- Name: meeting_mom meeting_mom_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_mom
    ADD CONSTRAINT meeting_mom_pkey PRIMARY KEY (id);


--
-- Name: meeting_updates meeting_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_updates
    ADD CONSTRAINT meeting_updates_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_project_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_user_id_key UNIQUE (project_id, user_id);


--
-- Name: project_updates project_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: task_activities task_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_pkey PRIMARY KEY (id);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_org_id_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_org_id_employee_code_key UNIQUE (org_id, employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_meetings_org; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_meetings_org ON public.meetings USING btree (org_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_projects_org; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_projects_org ON public.projects USING btree (org_id);


--
-- Name: idx_tasks_assigned_by; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_tasks_assigned_by ON public.tasks USING btree (assigned_by);


--
-- Name: idx_tasks_assigned_to; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_org; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_tasks_org ON public.tasks USING btree (org_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_org; Type: INDEX; Schema: public; Owner: taskadmin
--

CREATE INDEX idx_users_org ON public.users USING btree (org_id);


--
-- Name: companies companies_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: departments departments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: designations designations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: locations locations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: meeting_members meeting_members_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_members meeting_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meeting_mom meeting_mom_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_mom
    ADD CONSTRAINT meeting_mom_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_mom meeting_mom_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_mom
    ADD CONSTRAINT meeting_mom_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meeting_updates meeting_updates_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_updates
    ADD CONSTRAINT meeting_updates_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_updates meeting_updates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meeting_updates
    ADD CONSTRAINT meeting_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meetings meetings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: meetings meetings_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: meetings meetings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: meetings meetings_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: meetings meetings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: notifications notifications_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_updates project_updates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_updates project_updates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.project_updates
    ADD CONSTRAINT project_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: projects projects_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: projects projects_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: projects projects_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: task_activities task_activities_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_activities task_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_attachments task_attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: tasks tasks_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: tasks tasks_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: tasks tasks_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id);


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.designations(id);


--
-- Name: users users_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: users users_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO taskadmin;


--
-- PostgreSQL database dump complete
--

\unrestrict EgYEdTGM2VG4neqNB2pNxYDcj711RcEOqS1sEBcdDeJ8h0LUEXYZvmIKIEFt8Cr

