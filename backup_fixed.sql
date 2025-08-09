--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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
-- Name: album_access; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.album_access (
    id integer NOT NULL,
    album_id integer NOT NULL,
    photo_id integer,
    buyer_id character varying NOT NULL,
    seller_id character varying NOT NULL,
    access_type character varying NOT NULL,
    gift_paid jsonb NOT NULL,
    amount_paid integer NOT NULL,
    purchased_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone
);


ALTER TABLE public.album_access OWNER TO laabobo_user;

--
-- Name: album_access_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.album_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.album_access_id_seq OWNER TO laabobo_user;

--
-- Name: album_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.album_access_id_seq OWNED BY public.album_access.id;


--
-- Name: album_photos; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.album_photos (
    id integer NOT NULL,
    album_id integer NOT NULL,
    image_url text NOT NULL,
    caption text,
    gift_required jsonb,
    access_price integer DEFAULT 0,
    total_views integer DEFAULT 0,
    is_active boolean DEFAULT true,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.album_photos OWNER TO laabobo_user;

--
-- Name: album_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.album_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.album_photos_id_seq OWNER TO laabobo_user;

--
-- Name: album_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.album_photos_id_seq OWNED BY public.album_photos.id;


--
-- Name: album_purchases; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.album_purchases (
    id text NOT NULL,
    album_id text NOT NULL,
    buyer_id text NOT NULL,
    price integer NOT NULL,
    purchased_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.album_purchases OWNER TO laabobo_user;

--
-- Name: alliance_members; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.alliance_members (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    member_id character varying NOT NULL,
    role character varying DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT now(),
    contribution_score integer DEFAULT 0
);


ALTER TABLE public.alliance_members OWNER TO laabobo_user;

--
-- Name: alliance_members_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.alliance_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alliance_members_id_seq OWNER TO laabobo_user;

--
-- Name: alliance_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.alliance_members_id_seq OWNED BY public.alliance_members.id;


--
-- Name: alliances; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.alliances (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    leader_id character varying NOT NULL,
    max_members integer DEFAULT 50,
    current_members integer DEFAULT 1,
    alliance_level integer DEFAULT 1,
    total_score integer DEFAULT 0,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.alliances OWNER TO laabobo_user;

--
-- Name: alliances_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.alliances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alliances_id_seq OWNER TO laabobo_user;

--
-- Name: alliances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.alliances_id_seq OWNED BY public.alliances.id;


--
-- Name: blocked_users; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.blocked_users (
    id integer NOT NULL,
    blocker_id character varying NOT NULL,
    blocked_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blocked_users OWNER TO laabobo_user;

--
-- Name: blocked_users_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.blocked_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocked_users_id_seq OWNER TO laabobo_user;

--
-- Name: blocked_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.blocked_users_id_seq OWNED BY public.blocked_users.id;


--
-- Name: character_items; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.character_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    rarity character varying DEFAULT 'common'::character varying NOT NULL,
    stats jsonb,
    is_premium boolean DEFAULT false,
    price integer DEFAULT 0,
    description text,
    image_url character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.character_items OWNER TO laabobo_user;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    stream_id integer NOT NULL,
    user_id character varying NOT NULL,
    message text NOT NULL,
    sent_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO laabobo_user;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO laabobo_user;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: city_zones; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.city_zones (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    difficulty character varying NOT NULL,
    is_liberated boolean DEFAULT false,
    liberation_progress integer DEFAULT 0,
    required_players integer DEFAULT 1,
    rewards jsonb,
    enemy_types jsonb,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    unlock_level integer DEFAULT 1
);


ALTER TABLE public.city_zones OWNER TO laabobo_user;

--
-- Name: city_zones_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.city_zones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.city_zones_id_seq OWNER TO laabobo_user;

--
-- Name: city_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.city_zones_id_seq OWNED BY public.city_zones.id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comment_likes OWNER TO laabobo_user;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_likes_id_seq OWNER TO laabobo_user;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.comment_likes_id_seq OWNED BY public.comment_likes.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    content text NOT NULL,
    author_id character varying NOT NULL,
    post_id integer NOT NULL,
    post_type character varying NOT NULL,
    parent_id integer,
    like_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO laabobo_user;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO laabobo_user;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user1_id character varying NOT NULL,
    user2_id character varying NOT NULL,
    last_message text,
    last_message_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.conversations OWNER TO laabobo_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO laabobo_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: daily_missions; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.daily_missions (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    game_type character varying NOT NULL,
    target_value integer NOT NULL,
    reward_points integer NOT NULL,
    reward_items jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.daily_missions OWNER TO laabobo_user;

--
-- Name: daily_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.daily_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_missions_id_seq OWNER TO laabobo_user;

--
-- Name: daily_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.daily_missions_id_seq OWNED BY public.daily_missions.id;


--
-- Name: followers; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.followers (
    id integer NOT NULL,
    follower_id character varying NOT NULL,
    followed_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.followers OWNER TO laabobo_user;

--
-- Name: followers_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.followers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.followers_id_seq OWNER TO laabobo_user;

--
-- Name: followers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.followers_id_seq OWNED BY public.followers.id;


--
-- Name: fragment_collections; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.fragment_collections (
    id integer NOT NULL,
    fragment_id integer NOT NULL,
    collection_id integer NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.fragment_collections OWNER TO laabobo_user;

--
-- Name: fragment_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.fragment_collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fragment_collections_id_seq OWNER TO laabobo_user;

--
-- Name: fragment_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.fragment_collections_id_seq OWNED BY public.fragment_collections.id;


--
-- Name: game_characters; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.game_characters (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    rarity character varying DEFAULT 'common'::character varying NOT NULL,
    base_stats jsonb,
    appearance jsonb,
    skills text[],
    is_premium boolean DEFAULT false,
    price integer DEFAULT 0,
    description text,
    image_url character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.game_characters OWNER TO laabobo_user;

--
-- Name: game_participants; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.game_participants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    room_id character varying NOT NULL,
    user_id character varying NOT NULL,
    pet_id character varying,
    joined_at timestamp without time zone DEFAULT now(),
    score integer DEFAULT 0,
    "position" integer,
    points_spent integer DEFAULT 0,
    points_won integer DEFAULT 0,
    is_ready boolean DEFAULT false
);


ALTER TABLE public.game_participants OWNER TO laabobo_user;

--
-- Name: game_rooms; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.game_rooms (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    game_type character varying NOT NULL,
    host_id character varying NOT NULL,
    name character varying NOT NULL,
    description character varying,
    max_players integer DEFAULT 4 NOT NULL,
    current_players integer DEFAULT 1 NOT NULL,
    status character varying DEFAULT 'waiting'::character varying NOT NULL,
    entry_fee integer DEFAULT 0 NOT NULL,
    prize_pool integer DEFAULT 0 NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    game_data text,
    created_at timestamp without time zone DEFAULT now(),
    started_at timestamp without time zone,
    ended_at timestamp without time zone
);


ALTER TABLE public.game_rooms OWNER TO laabobo_user;

--
-- Name: garden_activities; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.garden_activities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    pet_id character varying NOT NULL,
    activity_type character varying NOT NULL,
    item_used character varying,
    health_change integer DEFAULT 0,
    happiness_change integer DEFAULT 0,
    experience_gained integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.garden_activities OWNER TO laabobo_user;

--
-- Name: garden_items; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.garden_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description character varying,
    emoji character varying NOT NULL,
    type character varying NOT NULL,
    price integer NOT NULL,
    health_boost integer DEFAULT 0,
    happiness_boost integer DEFAULT 0,
    experience_boost integer DEFAULT 0,
    rarity character varying DEFAULT 'common'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.garden_items OWNER TO laabobo_user;

--
-- Name: garden_support; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.garden_support (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    supporter_id character varying NOT NULL,
    garden_owner_id character varying NOT NULL,
    support_type character varying NOT NULL,
    amount integer NOT NULL,
    currency character varying DEFAULT 'points'::character varying NOT NULL,
    message text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    ends_at timestamp without time zone
);


ALTER TABLE public.garden_support OWNER TO laabobo_user;

--
-- Name: garden_visits; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.garden_visits (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    visitor_id character varying NOT NULL,
    host_id character varying NOT NULL,
    pet_id character varying NOT NULL,
    gift_given character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.garden_visits OWNER TO laabobo_user;

--
-- Name: gift_characters; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.gift_characters (
    id integer NOT NULL,
    name character varying NOT NULL,
    emoji character varying NOT NULL,
    description text,
    point_cost integer NOT NULL,
    animation_type character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    has_sound boolean DEFAULT false,
    sound_file_url text,
    has_special_effects boolean DEFAULT false,
    effect_duration integer DEFAULT 3,
    is_multi_language boolean DEFAULT false
);


ALTER TABLE public.gift_characters OWNER TO laabobo_user;

--
-- Name: gift_characters_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.gift_characters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gift_characters_id_seq OWNER TO laabobo_user;

--
-- Name: gift_characters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.gift_characters_id_seq OWNED BY public.gift_characters.id;


--
-- Name: gifts; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.gifts (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    stream_id integer,
    character_id integer NOT NULL,
    point_cost integer NOT NULL,
    message text,
    sent_at timestamp without time zone DEFAULT now(),
    memory_id integer
);


ALTER TABLE public.gifts OWNER TO laabobo_user;

--
-- Name: gifts_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.gifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gifts_id_seq OWNER TO laabobo_user;

--
-- Name: gifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.gifts_id_seq OWNED BY public.gifts.id;


--
-- Name: group_room_messages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.group_room_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    sender_id character varying NOT NULL,
    content text NOT NULL,
    message_type character varying DEFAULT 'text'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.group_room_messages OWNER TO laabobo_user;

--
-- Name: group_room_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.group_room_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_room_messages_id_seq OWNER TO laabobo_user;

--
-- Name: group_room_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.group_room_messages_id_seq OWNED BY public.group_room_messages.id;


--
-- Name: group_room_participants; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.group_room_participants (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id character varying NOT NULL,
    gift_paid jsonb NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.group_room_participants OWNER TO laabobo_user;

--
-- Name: group_room_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.group_room_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_room_participants_id_seq OWNER TO laabobo_user;

--
-- Name: group_room_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.group_room_participants_id_seq OWNED BY public.group_room_participants.id;


--
-- Name: group_rooms; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.group_rooms (
    id integer NOT NULL,
    host_id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    gift_required jsonb NOT NULL,
    entry_price integer NOT NULL,
    max_participants integer DEFAULT 10,
    current_participants integer DEFAULT 0,
    duration integer DEFAULT 60,
    is_active boolean DEFAULT true,
    is_open boolean DEFAULT true,
    room_started_at timestamp without time zone DEFAULT now(),
    room_ends_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.group_rooms OWNER TO laabobo_user;

--
-- Name: group_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.group_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_rooms_id_seq OWNER TO laabobo_user;

--
-- Name: group_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.group_rooms_id_seq OWNED BY public.group_rooms.id;


--
-- Name: locked_album_content; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.locked_album_content (
    id text NOT NULL,
    album_id text NOT NULL,
    type text NOT NULL,
    url text,
    content text,
    thumbnail text,
    caption text,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.locked_album_content OWNER TO laabobo_user;

--
-- Name: locked_albums; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.locked_albums (
    id text NOT NULL,
    owner_id text NOT NULL,
    title text NOT NULL,
    description text,
    price integer DEFAULT 100 NOT NULL,
    cover_image text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.locked_albums OWNER TO laabobo_user;

--
-- Name: memory_collections; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.memory_collections (
    id integer NOT NULL,
    author_id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    cover_image_url text,
    is_public boolean DEFAULT true,
    fragment_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.memory_collections OWNER TO laabobo_user;

--
-- Name: memory_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.memory_collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_collections_id_seq OWNER TO laabobo_user;

--
-- Name: memory_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.memory_collections_id_seq OWNED BY public.memory_collections.id;


--
-- Name: memory_fragments; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.memory_fragments (
    id integer NOT NULL,
    author_id character varying NOT NULL,
    type character varying NOT NULL,
    title text,
    caption text,
    media_urls jsonb NOT NULL,
    thumbnail_url text,
    initial_energy integer DEFAULT 100,
    current_energy integer DEFAULT 100,
    energy_decay_rate numeric(3,2) DEFAULT 0.5,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    gift_count integer DEFAULT 0,
    memory_type character varying DEFAULT 'fleeting'::character varying,
    mood character varying,
    tags jsonb,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT true,
    expires_at timestamp without time zone,
    location text,
    weather character varying,
    time_of_day character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    visibility_level character varying DEFAULT 'public'::character varying,
    allow_comments boolean DEFAULT true,
    allow_sharing boolean DEFAULT true,
    allow_gifts boolean DEFAULT true
);


ALTER TABLE public.memory_fragments OWNER TO laabobo_user;

--
-- Name: memory_fragments_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.memory_fragments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_fragments_id_seq OWNER TO laabobo_user;

--
-- Name: memory_fragments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.memory_fragments_id_seq OWNED BY public.memory_fragments.id;


--
-- Name: memory_interactions; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.memory_interactions (
    id integer NOT NULL,
    fragment_id integer NOT NULL,
    user_id character varying NOT NULL,
    type character varying NOT NULL,
    energy_boost integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.memory_interactions OWNER TO laabobo_user;

--
-- Name: memory_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.memory_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_interactions_id_seq OWNER TO laabobo_user;

--
-- Name: memory_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.memory_interactions_id_seq OWNED BY public.memory_interactions.id;


--
-- Name: memory_views; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.memory_views (
    id integer NOT NULL,
    memory_id integer NOT NULL,
    viewer_id character varying NOT NULL,
    viewed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.memory_views OWNER TO laabobo_user;

--
-- Name: memory_views_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.memory_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memory_views_id_seq OWNER TO laabobo_user;

--
-- Name: memory_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.memory_views_id_seq OWNED BY public.memory_views.id;


--
-- Name: message_requests; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.message_requests (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    initial_message text NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    responded_at timestamp without time zone
);


ALTER TABLE public.message_requests OWNER TO laabobo_user;

--
-- Name: message_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.message_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_requests_id_seq OWNER TO laabobo_user;

--
-- Name: message_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.message_requests_id_seq OWNED BY public.message_requests.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    recipient_id character varying NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    message_type character varying DEFAULT 'text'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO laabobo_user;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO laabobo_user;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    from_user_id character varying NOT NULL,
    type character varying NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    related_id integer,
    related_type character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO laabobo_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO laabobo_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pet_achievements; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.pet_achievements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    pet_id character varying NOT NULL,
    achievement_type character varying NOT NULL,
    achievement_value integer NOT NULL,
    unlocked boolean DEFAULT false NOT NULL,
    unlocked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pet_achievements OWNER TO laabobo_user;

--
-- Name: player_mission_progress; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.player_mission_progress (
    id integer NOT NULL,
    player_id character varying NOT NULL,
    mission_id integer NOT NULL,
    current_progress integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.player_mission_progress OWNER TO laabobo_user;

--
-- Name: player_mission_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.player_mission_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.player_mission_progress_id_seq OWNER TO laabobo_user;

--
-- Name: player_mission_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.player_mission_progress_id_seq OWNED BY public.player_mission_progress.id;


--
-- Name: player_rankings; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.player_rankings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    game_type character varying NOT NULL,
    total_games integer DEFAULT 0 NOT NULL,
    total_wins integer DEFAULT 0 NOT NULL,
    total_points_spent integer DEFAULT 0 NOT NULL,
    total_points_won integer DEFAULT 0 NOT NULL,
    current_level integer DEFAULT 1 NOT NULL,
    experience integer DEFAULT 0 NOT NULL,
    rank character varying DEFAULT 'bronze'::character varying NOT NULL,
    last_played timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.player_rankings OWNER TO laabobo_user;

--
-- Name: point_packages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.point_packages (
    id integer NOT NULL,
    name character varying NOT NULL,
    point_amount integer NOT NULL,
    price_in_cents integer NOT NULL,
    price_display character varying NOT NULL,
    currency character varying DEFAULT 'USD'::character varying NOT NULL,
    bonus_points integer DEFAULT 0,
    is_popular boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.point_packages OWNER TO laabobo_user;

--
-- Name: point_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.point_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.point_packages_id_seq OWNER TO laabobo_user;

--
-- Name: point_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.point_packages_id_seq OWNED BY public.point_packages.id;


--
-- Name: point_transactions; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.point_transactions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    amount integer NOT NULL,
    type character varying NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    related_gift_id integer,
    stripe_payment_id character varying,
    payment_status character varying DEFAULT 'completed'::character varying
);


ALTER TABLE public.point_transactions OWNER TO laabobo_user;

--
-- Name: point_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.point_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.point_transactions_id_seq OWNER TO laabobo_user;

--
-- Name: point_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.point_transactions_id_seq OWNED BY public.point_transactions.id;


--
-- Name: premium_album_media; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.premium_album_media (
    id integer NOT NULL,
    album_id integer NOT NULL,
    media_url text NOT NULL,
    media_type character varying NOT NULL,
    caption text,
    order_index integer DEFAULT 0 NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.premium_album_media OWNER TO laabobo_user;

--
-- Name: premium_album_media_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.premium_album_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premium_album_media_id_seq OWNER TO laabobo_user;

--
-- Name: premium_album_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.premium_album_media_id_seq OWNED BY public.premium_album_media.id;


--
-- Name: premium_album_purchases; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.premium_album_purchases (
    id integer NOT NULL,
    album_id integer NOT NULL,
    buyer_id character varying NOT NULL,
    gift_id integer NOT NULL,
    gift_amount integer NOT NULL,
    total_cost integer NOT NULL,
    purchased_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.premium_album_purchases OWNER TO laabobo_user;

--
-- Name: premium_album_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.premium_album_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premium_album_purchases_id_seq OWNER TO laabobo_user;

--
-- Name: premium_album_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.premium_album_purchases_id_seq OWNED BY public.premium_album_purchases.id;


--
-- Name: premium_albums; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.premium_albums (
    id integer NOT NULL,
    creator_id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    cover_image_url text,
    required_gift_id integer NOT NULL,
    required_gift_amount integer DEFAULT 1 NOT NULL,
    total_photos integer DEFAULT 0 NOT NULL,
    total_views integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.premium_albums OWNER TO laabobo_user;

--
-- Name: premium_albums_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.premium_albums_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premium_albums_id_seq OWNER TO laabobo_user;

--
-- Name: premium_albums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.premium_albums_id_seq OWNED BY public.premium_albums.id;


--
-- Name: premium_messages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.premium_messages (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    recipient_id character varying NOT NULL,
    album_id integer NOT NULL,
    message text,
    is_unlocked boolean DEFAULT false NOT NULL,
    unlocked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.premium_messages OWNER TO laabobo_user;

--
-- Name: premium_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.premium_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premium_messages_id_seq OWNER TO laabobo_user;

--
-- Name: premium_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.premium_messages_id_seq OWNED BY public.premium_messages.id;


--
-- Name: private_albums; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.private_albums (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    album_type character varying NOT NULL,
    gift_required jsonb,
    access_price integer DEFAULT 0,
    is_active boolean DEFAULT true,
    total_photos integer DEFAULT 0,
    total_views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.private_albums OWNER TO laabobo_user;

--
-- Name: private_albums_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.private_albums_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_albums_id_seq OWNER TO laabobo_user;

--
-- Name: private_albums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.private_albums_id_seq OWNED BY public.private_albums.id;


--
-- Name: private_content_requests; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.private_content_requests (
    id text NOT NULL,
    from_user_id text NOT NULL,
    to_user_id text NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    offered_price integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    content_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    responded_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.private_content_requests OWNER TO laabobo_user;

--
-- Name: private_messages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.private_messages (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.private_messages OWNER TO laabobo_user;

--
-- Name: private_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.private_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_messages_id_seq OWNER TO laabobo_user;

--
-- Name: private_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.private_messages_id_seq OWNED BY public.private_messages.id;


--
-- Name: private_room_messages; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.private_room_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    sender_id character varying NOT NULL,
    content text NOT NULL,
    message_type character varying DEFAULT 'text'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.private_room_messages OWNER TO laabobo_user;

--
-- Name: private_room_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.private_room_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_room_messages_id_seq OWNER TO laabobo_user;

--
-- Name: private_room_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.private_room_messages_id_seq OWNED BY public.private_room_messages.id;


--
-- Name: private_rooms; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.private_rooms (
    id integer NOT NULL,
    host_id character varying NOT NULL,
    invited_user_id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    gift_required jsonb NOT NULL,
    entry_price integer NOT NULL,
    is_active boolean DEFAULT true,
    invitation_sent boolean DEFAULT false,
    invitation_accepted boolean DEFAULT false,
    gift_paid boolean DEFAULT false,
    room_started boolean DEFAULT false,
    room_ended_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.private_rooms OWNER TO laabobo_user;

--
-- Name: private_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.private_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_rooms_id_seq OWNER TO laabobo_user;

--
-- Name: private_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.private_rooms_id_seq OWNED BY public.private_rooms.id;


--
-- Name: room_invitations; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.room_invitations (
    id integer NOT NULL,
    room_id integer NOT NULL,
    from_user_id character varying NOT NULL,
    to_user_id character varying NOT NULL,
    message text,
    gift_required jsonb NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    expires_at timestamp without time zone,
    responded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.room_invitations OWNER TO laabobo_user;

--
-- Name: room_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.room_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_invitations_id_seq OWNER TO laabobo_user;

--
-- Name: room_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.room_invitations_id_seq OWNED BY public.room_invitations.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO laabobo_user;

--
-- Name: streams; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.streams (
    id integer NOT NULL,
    host_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    category character varying NOT NULL,
    thumbnail_url text,
    is_live boolean DEFAULT true,
    viewer_count integer DEFAULT 0,
    total_gifts integer DEFAULT 0,
    started_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.streams OWNER TO laabobo_user;

--
-- Name: streams_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.streams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.streams_id_seq OWNER TO laabobo_user;

--
-- Name: streams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.streams_id_seq OWNED BY public.streams.id;


--
-- Name: user_character_items; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.user_character_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    item_id character varying NOT NULL,
    quantity integer DEFAULT 1,
    purchased_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_character_items OWNER TO laabobo_user;

--
-- Name: user_characters; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.user_characters (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    character_id character varying NOT NULL,
    level integer DEFAULT 1,
    experience integer DEFAULT 0,
    current_stats jsonb,
    equipment jsonb,
    customization jsonb,
    purchased_at timestamp without time zone DEFAULT now(),
    last_used timestamp without time zone
);


ALTER TABLE public.user_characters OWNER TO laabobo_user;

--
-- Name: user_inventory; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.user_inventory (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    item_id character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_inventory OWNER TO laabobo_user;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.user_profiles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    bio text,
    favorite_game character varying,
    garden_theme character varying DEFAULT 'default'::character varying,
    total_support_received integer DEFAULT 0,
    total_support_given integer DEFAULT 0,
    garden_level integer DEFAULT 1,
    garden_experience integer DEFAULT 0,
    is_public boolean DEFAULT true,
    allow_visitors boolean DEFAULT true,
    allow_gifts boolean DEFAULT true,
    customizations text,
    achievements text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_profiles OWNER TO laabobo_user;

--
-- Name: user_wallets; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.user_wallets (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    total_earnings integer DEFAULT 0 NOT NULL,
    available_balance integer DEFAULT 0 NOT NULL,
    total_withdrawn integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_wallets OWNER TO laabobo_user;

--
-- Name: user_wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.user_wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_wallets_id_seq OWNER TO laabobo_user;

--
-- Name: user_wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.user_wallets_id_seq OWNED BY public.user_wallets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    username character varying NOT NULL,
    bio text,
    points integer DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT '0'::numeric,
    is_streamer boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying DEFAULT 'user'::character varying NOT NULL,
    is_private_account boolean DEFAULT false,
    allow_direct_messages boolean DEFAULT true,
    allow_gifts_from_strangers boolean DEFAULT true,
    password_hash character varying NOT NULL,
    show_last_seen boolean DEFAULT true,
    last_seen_at timestamp without time zone DEFAULT now(),
    is_online boolean DEFAULT false,
    last_activity_at timestamp without time zone DEFAULT now(),
    online_status_updated_at timestamp without time zone DEFAULT now(),
    total_gifts_received numeric(10,2) DEFAULT 0,
    total_gifts_sent numeric(10,2) DEFAULT 0,
    supporter_level integer DEFAULT 0,
    supporter_badge character varying,
    cover_image_url character varying,
    country_code character varying(2),
    country_name character varying(100),
    country_flag character varying(10),
    is_verified boolean DEFAULT false,
    verified_email character varying,
    verification_badge character varying DEFAULT 'LaaBoBo'::character varying,
    verified_at timestamp without time zone,
    mfa_secret character varying,
    mfa_enabled boolean DEFAULT false,
    mfa_backup_codes text[],
    mfa_enabled_at timestamp without time zone,
    password_reset_token character varying,
    password_reset_expiry character varying,
    date_of_birth timestamp without time zone
);


ALTER TABLE public.users OWNER TO laabobo_user;

--
-- Name: virtual_pets; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.virtual_pets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name character varying DEFAULT 'أرنوب الصغير'::character varying NOT NULL,
    type character varying DEFAULT 'rabbit'::character varying NOT NULL,
    health integer DEFAULT 80 NOT NULL,
    happiness integer DEFAULT 60 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    experience integer DEFAULT 0 NOT NULL,
    last_fed timestamp without time zone DEFAULT now(),
    last_played timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.virtual_pets OWNER TO laabobo_user;

--
-- Name: voice_chat_participants; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.voice_chat_participants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    chat_room_id character varying NOT NULL,
    user_id character varying NOT NULL,
    is_muted boolean DEFAULT false,
    is_deafened boolean DEFAULT false,
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone
);


ALTER TABLE public.voice_chat_participants OWNER TO laabobo_user;

--
-- Name: voice_chat_rooms; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.voice_chat_rooms (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    game_room_id character varying,
    is_active boolean DEFAULT true,
    max_participants integer DEFAULT 8,
    current_participants integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.voice_chat_rooms OWNER TO laabobo_user;

--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: laabobo_user
--

CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    amount integer NOT NULL,
    type character varying NOT NULL,
    description text,
    gift_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    related_user_id character varying,
    related_album_id integer,
    related_photo_id integer,
    status character varying DEFAULT 'completed'::character varying
);


ALTER TABLE public.wallet_transactions OWNER TO laabobo_user;

--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: laabobo_user
--

CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wallet_transactions_id_seq OWNER TO laabobo_user;

--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: laabobo_user
--

ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;


--
-- Name: album_access id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_access ALTER COLUMN id SET DEFAULT nextval('public.album_access_id_seq'::regclass);


--
-- Name: album_photos id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_photos ALTER COLUMN id SET DEFAULT nextval('public.album_photos_id_seq'::regclass);


--
-- Name: alliance_members id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliance_members ALTER COLUMN id SET DEFAULT nextval('public.alliance_members_id_seq'::regclass);


--
-- Name: alliances id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliances ALTER COLUMN id SET DEFAULT nextval('public.alliances_id_seq'::regclass);


--
-- Name: blocked_users id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.blocked_users ALTER COLUMN id SET DEFAULT nextval('public.blocked_users_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: city_zones id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.city_zones ALTER COLUMN id SET DEFAULT nextval('public.city_zones_id_seq'::regclass);


--
-- Name: comment_likes id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comment_likes ALTER COLUMN id SET DEFAULT nextval('public.comment_likes_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: daily_missions id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.daily_missions ALTER COLUMN id SET DEFAULT nextval('public.daily_missions_id_seq'::regclass);


--
-- Name: followers id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.followers ALTER COLUMN id SET DEFAULT nextval('public.followers_id_seq'::regclass);


--
-- Name: fragment_collections id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.fragment_collections ALTER COLUMN id SET DEFAULT nextval('public.fragment_collections_id_seq'::regclass);


--
-- Name: gift_characters id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gift_characters ALTER COLUMN id SET DEFAULT nextval('public.gift_characters_id_seq'::regclass);


--
-- Name: gifts id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts ALTER COLUMN id SET DEFAULT nextval('public.gifts_id_seq'::regclass);


--
-- Name: group_room_messages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_messages ALTER COLUMN id SET DEFAULT nextval('public.group_room_messages_id_seq'::regclass);


--
-- Name: group_room_participants id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_participants ALTER COLUMN id SET DEFAULT nextval('public.group_room_participants_id_seq'::regclass);


--
-- Name: group_rooms id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_rooms ALTER COLUMN id SET DEFAULT nextval('public.group_rooms_id_seq'::regclass);


--
-- Name: memory_collections id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_collections ALTER COLUMN id SET DEFAULT nextval('public.memory_collections_id_seq'::regclass);


--
-- Name: memory_fragments id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_fragments ALTER COLUMN id SET DEFAULT nextval('public.memory_fragments_id_seq'::regclass);


--
-- Name: memory_interactions id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_interactions ALTER COLUMN id SET DEFAULT nextval('public.memory_interactions_id_seq'::regclass);


--
-- Name: memory_views id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_views ALTER COLUMN id SET DEFAULT nextval('public.memory_views_id_seq'::regclass);


--
-- Name: message_requests id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.message_requests ALTER COLUMN id SET DEFAULT nextval('public.message_requests_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: player_mission_progress id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.player_mission_progress ALTER COLUMN id SET DEFAULT nextval('public.player_mission_progress_id_seq'::regclass);


--
-- Name: point_packages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.point_packages ALTER COLUMN id SET DEFAULT nextval('public.point_packages_id_seq'::regclass);


--
-- Name: point_transactions id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.point_transactions ALTER COLUMN id SET DEFAULT nextval('public.point_transactions_id_seq'::regclass);


--
-- Name: premium_album_media id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_media ALTER COLUMN id SET DEFAULT nextval('public.premium_album_media_id_seq'::regclass);


--
-- Name: premium_album_purchases id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_purchases ALTER COLUMN id SET DEFAULT nextval('public.premium_album_purchases_id_seq'::regclass);


--
-- Name: premium_albums id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_albums ALTER COLUMN id SET DEFAULT nextval('public.premium_albums_id_seq'::regclass);


--
-- Name: premium_messages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_messages ALTER COLUMN id SET DEFAULT nextval('public.premium_messages_id_seq'::regclass);


--
-- Name: private_albums id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_albums ALTER COLUMN id SET DEFAULT nextval('public.private_albums_id_seq'::regclass);


--
-- Name: private_messages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_messages ALTER COLUMN id SET DEFAULT nextval('public.private_messages_id_seq'::regclass);


--
-- Name: private_room_messages id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_room_messages ALTER COLUMN id SET DEFAULT nextval('public.private_room_messages_id_seq'::regclass);


--
-- Name: private_rooms id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_rooms ALTER COLUMN id SET DEFAULT nextval('public.private_rooms_id_seq'::regclass);


--
-- Name: room_invitations id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.room_invitations ALTER COLUMN id SET DEFAULT nextval('public.room_invitations_id_seq'::regclass);


--
-- Name: streams id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.streams ALTER COLUMN id SET DEFAULT nextval('public.streams_id_seq'::regclass);


--
-- Name: user_wallets id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_wallets ALTER COLUMN id SET DEFAULT nextval('public.user_wallets_id_seq'::regclass);


--
-- Name: wallet_transactions id; Type: DEFAULT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);


--
-- Data for Name: album_access; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.album_access (id, album_id, photo_id, buyer_id, seller_id, access_type, gift_paid, amount_paid, purchased_at, expires_at) FROM stdin;
\.


--
-- Data for Name: album_photos; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.album_photos (id, album_id, image_url, caption, gift_required, access_price, total_views, is_active, uploaded_at) FROM stdin;
\.


--
-- Data for Name: album_purchases; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.album_purchases (id, album_id, buyer_id, price, purchased_at) FROM stdin;
\.


--
-- Data for Name: alliance_members; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.alliance_members (id, alliance_id, member_id, role, joined_at, contribution_score) FROM stdin;
\.


--
-- Data for Name: alliances; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.alliances (id, name, description, leader_id, max_members, current_members, alliance_level, total_score, is_public, created_at) FROM stdin;
\.


--
-- Data for Name: blocked_users; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.blocked_users (id, blocker_id, blocked_id, created_at) FROM stdin;
\.


--
-- Data for Name: character_items; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.character_items (id, name, type, rarity, stats, is_premium, price, description, image_url, created_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.chat_messages (id, stream_id, user_id, message, sent_at) FROM stdin;
\.


--
-- Data for Name: city_zones; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.city_zones (id, name, description, difficulty, is_liberated, liberation_progress, required_players, rewards, enemy_types, position_x, position_y, unlock_level) FROM stdin;
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.comment_likes (id, comment_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.comments (id, content, author_id, post_id, post_type, parent_id, like_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.conversations (id, user1_id, user2_id, last_message, last_message_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: daily_missions; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.daily_missions (id, name, description, game_type, target_value, reward_points, reward_items, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.followers (id, follower_id, followed_id, created_at) FROM stdin;
\.


--
-- Data for Name: fragment_collections; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.fragment_collections (id, fragment_id, collection_id, added_at) FROM stdin;
\.


--
-- Data for Name: game_characters; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.game_characters (id, name, type, rarity, base_stats, appearance, skills, is_premium, price, description, image_url, created_at) FROM stdin;
\.


--
-- Data for Name: game_participants; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.game_participants (id, room_id, user_id, pet_id, joined_at, score, "position", points_spent, points_won, is_ready) FROM stdin;
\.


--
-- Data for Name: game_rooms; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.game_rooms (id, game_type, host_id, name, description, max_players, current_players, status, entry_fee, prize_pool, is_private, game_data, created_at, started_at, ended_at) FROM stdin;
\.


--
-- Data for Name: garden_activities; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.garden_activities (id, user_id, pet_id, activity_type, item_used, health_change, happiness_change, experience_gained, created_at) FROM stdin;
\.


--
-- Data for Name: garden_items; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.garden_items (id, name, description, emoji, type, price, health_boost, happiness_boost, experience_boost, rarity, created_at) FROM stdin;
\.


--
-- Data for Name: garden_support; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.garden_support (id, supporter_id, garden_owner_id, support_type, amount, currency, message, is_active, created_at, ends_at) FROM stdin;
\.


--
-- Data for Name: garden_visits; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.garden_visits (id, visitor_id, host_id, pet_id, gift_given, created_at) FROM stdin;
\.


--
-- Data for Name: gift_characters; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.gift_characters (id, name, emoji, description, point_cost, animation_type, is_active, created_at, has_sound, sound_file_url, has_special_effects, effect_duration, is_multi_language) FROM stdin;
34	BoBo Love	🐰💕	Rabbit with flying hearts	100	hearts	t	2025-08-07 09:23:47.823004	f	\N	f	3	f
35	BoFire	🐲🔥	Dragon with neon fire	500	fire	t	2025-08-07 09:23:47.903951	f	\N	f	3	f
36	Nunu Magic	🦄🌟	Flying horse with stars	1000	rainbow	t	2025-08-07 09:23:47.976947	f	\N	f	3	f
37	Dodo Splash	🦆💦	Duck with bubbles	250	bubbles	t	2025-08-07 09:23:48.0493	f	\N	f	3	f
38	Meemo Wink	🐱🌈	Cat with rainbow	750	rainbow_wave	t	2025-08-07 09:23:48.121845	f	\N	f	3	f
\.


--
-- Data for Name: gifts; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.gifts (id, sender_id, receiver_id, stream_id, character_id, point_cost, message, sent_at, memory_id) FROM stdin;
\.


--
-- Data for Name: group_room_messages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.group_room_messages (id, room_id, sender_id, content, message_type, created_at) FROM stdin;
\.


--
-- Data for Name: group_room_participants; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.group_room_participants (id, room_id, user_id, gift_paid, joined_at, left_at, is_active) FROM stdin;
\.


--
-- Data for Name: group_rooms; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.group_rooms (id, host_id, title, description, gift_required, entry_price, max_participants, current_participants, duration, is_active, is_open, room_started_at, room_ends_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: locked_album_content; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.locked_album_content (id, album_id, type, url, content, thumbnail, caption, "order", created_at) FROM stdin;
\.


--
-- Data for Name: locked_albums; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.locked_albums (id, owner_id, title, description, price, cover_image, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: memory_collections; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.memory_collections (id, author_id, title, description, cover_image_url, is_public, fragment_count, created_at) FROM stdin;
\.


--
-- Data for Name: memory_fragments; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.memory_fragments (id, author_id, type, title, caption, media_urls, thumbnail_url, initial_energy, current_energy, energy_decay_rate, view_count, like_count, share_count, gift_count, memory_type, mood, tags, is_active, is_public, expires_at, location, weather, time_of_day, created_at, updated_at, visibility_level, allow_comments, allow_sharing, allow_gifts) FROM stdin;
27	4OsJBdkrkj8RyijMOG6OR	image		الحياة ليست انتظار العاصفة، بل تعلّم	["/uploads/1754758490511-00cee3d40bc87a55ad57b116f8241acb.jpg"]	/uploads/1754758490511-00cee3d40bc87a55ad57b116f8241acb.jpg	100	100	0.50	2	0	0	0	permanent	\N	\N	t	t	\N	\N	\N	\N	2025-08-09 16:54:50.514231	2025-08-09 16:54:50.514231	public	t	t	t
25	xYCWKrFN5PtNpeOzFvrai	video			["/uploads/1754758312689-Ø§Ø¬ÙÙ Ø­Ø§ÙØ§Øª ÙØ§ØªØ³ Ø§Ø¨ 2024 Ø ÙØ¯Ø§Ø¹Ø§ ÙØ°Ø§ Ø§ÙÙÙÙØ¨ ð¥ºð(720P_HD).mp4"]	/uploads/1754758312689-Ø§Ø¬ÙÙ Ø­Ø§ÙØ§Øª ÙØ§ØªØ³ Ø§Ø¨ 2024 Ø ÙØ¯Ø§Ø¹Ø§ ÙØ°Ø§ Ø§ÙÙÙÙØ¨ ð¥ºð(720P_HD).mp4	100	100	0.50	3	0	0	0	star	\N	\N	t	t	2025-08-10 16:51:52.689	\N	\N	\N	2025-08-09 16:51:52.692082	2025-08-09 16:51:52.692082	public	t	t	t
23	xYCWKrFN5PtNpeOzFvrai	video			["/uploads/1754757331569-Ø§Ø¬ÙÙ Ø­Ø§ÙØ§Øª ÙØ§ØªØ³ Ø§Ø¨ 2024 Ø ÙØ¯Ø§Ø¹Ø§ ÙØ°Ø§ Ø§ÙÙÙÙØ¨ ð¥ºð(720P_HD).mp4"]	/uploads/1754757331569-Ø§Ø¬ÙÙ Ø­Ø§ÙØ§Øª ÙØ§ØªØ³ Ø§Ø¨ 2024 Ø ÙØ¯Ø§Ø¹Ø§ ÙØ°Ø§ Ø§ÙÙÙÙØ¨ ð¥ºð(720P_HD).mp4	100	100	0.50	4	0	0	0	permanent	\N	\N	f	t	\N	\N	\N	\N	2025-08-09 16:35:31.572614	2025-08-09 16:51:37.667	public	t	t	t
24	S6YmYPOXvY80kOEdCuqRy	video			["/uploads/1754758201864-1000197871.mp4"]	/uploads/1754758201864-1000197871.mp4	100	100	0.50	3	0	0	0	trending	\N	\N	t	t	2025-08-10 04:50:01.865	\N	\N	\N	2025-08-09 16:50:01.867859	2025-08-09 16:50:01.867859	public	t	t	t
20	4OsJBdkrkj8RyijMOG6OR	video		أجمل الأشياء تحدث لنا عندما لا نتوقعها	["/uploads/1754751918409-Ø³ØªÙØ±ÙØ§Øª ØªØ­ÙÙØ² Ø¨Ø¯ÙÙ Ø­ÙÙÙ ð¤(720P_HD).mp4"]	/uploads/1754751918409-Ø³ØªÙØ±ÙØ§Øª ØªØ­ÙÙØ² Ø¨Ø¯ÙÙ Ø­ÙÙÙ ð¤(720P_HD).mp4	100	100	0.50	3	2	0	0	permanent	\N	\N	f	t	\N	\N	\N	\N	2025-08-09 15:05:18.413561	2025-08-09 16:20:30.687	public	t	t	t
19	4OsJBdkrkj8RyijMOG6OR	image		عش حياتك كما لو أنك تعيشها مرتين، الأولى للتجربة والثانية للاستمتاع\r\n	["/uploads/1754751589724-screen-0.jpg"]	/uploads/1754751589724-screen-0.jpg	100	100	0.50	3	1	0	0	permanent	\N	\N	f	t	\N	\N	\N	\N	2025-08-09 14:59:49.729643	2025-08-09 16:20:34.336	public	t	t	t
21	4OsJBdkrkj8RyijMOG6OR	image		"عش حياتك كما لو أنك تعيشها مرتين	["/uploads/1754756562143-screen-0.jpg"]	/uploads/1754756562143-screen-0.jpg	100	100	0.50	5	1	0	0	permanent	\N	\N	f	t	\N	\N	\N	\N	2025-08-09 16:22:42.147451	2025-08-09 16:52:33.764	public	t	t	t
22	4OsJBdkrkj8RyijMOG6OR	video		أجمل الأشياء تحدث لنا عندما لا نتوقعها	["/uploads/1754756600314-Ø³ØªÙØ±ÙØ§Øª ØªØ­ÙÙØ² Ø¨Ø¯ÙÙ Ø­ÙÙÙ ð¤(720P_HD).mp4"]	/uploads/1754756600314-Ø³ØªÙØ±ÙØ§Øª ØªØ­ÙÙØ² Ø¨Ø¯ÙÙ Ø­ÙÙÙ ð¤(720P_HD).mp4	100	100	0.50	5	1	0	0	permanent	\N	\N	f	t	\N	\N	\N	\N	2025-08-09 16:23:20.324169	2025-08-09 16:52:37.002	public	t	t	t
26	4OsJBdkrkj8RyijMOG6OR	video		عش حياتك كما لو أنك تعيشها مرتين	["/uploads/1754758448593-Ø³ØªÙØ±ÙØ§Øª ØªØ­ÙÙØ² Ø¨Ø¯ÙÙ Ø­ÙÙÙ ð¤(720P_HD).mp4"]	/uploads/1754758448593-Ø³ØªÙØ±ÙØ§Øª ØªØ­ÙÙØ² Ø¨Ø¯ÙÙ Ø­ÙÙÙ ð¤(720P_HD).mp4	100	100	0.50	2	0	0	0	permanent	\N	\N	t	t	\N	\N	\N	\N	2025-08-09 16:54:08.597427	2025-08-09 16:54:08.597427	public	t	t	t
28	OFFICIAL-95424887205161159c	image			["/uploads/1754758770081-Screenshot_20250809_195908.jpg"]	/uploads/1754758770081-Screenshot_20250809_195908.jpg	100	100	0.50	2	0	0	0	permanent	\N	\N	t	t	\N	\N	\N	\N	2025-08-09 16:59:30.083626	2025-08-09 16:59:30.083626	public	t	t	t
\.


--
-- Data for Name: memory_interactions; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.memory_interactions (id, fragment_id, user_id, type, energy_boost, created_at) FROM stdin;
30	20	4OsJBdkrkj8RyijMOG6OR	like	1	2025-08-09 15:06:55.339
31	20	5V49HdIAJsdn9K0WZkbQ4	like	1	2025-08-09 15:38:35.116
32	19	5V49HdIAJsdn9K0WZkbQ4	like	1	2025-08-09 15:38:57.087
33	22	xYCWKrFN5PtNpeOzFvrai	like	1	2025-08-09 16:31:01.36
34	21	xYCWKrFN5PtNpeOzFvrai	like	1	2025-08-09 16:31:03.239
\.


--
-- Data for Name: memory_views; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.memory_views (id, memory_id, viewer_id, viewed_at) FROM stdin;
324	19	4OsJBdkrkj8RyijMOG6OR	2025-08-09 14:59:52.065003
612	27	OFFICIAL-95424887205161159c	2025-08-09 16:56:22.375604
614	24	OFFICIAL-95424887205161159c	2025-08-09 16:56:22.415684
333	20	4OsJBdkrkj8RyijMOG6OR	2025-08-09 15:05:20.638077
393	20	OFFICIAL-95424887205161159c	2025-08-09 15:46:48.715223
394	19	OFFICIAL-95424887205161159c	2025-08-09 15:46:49.144302
620	28	OFFICIAL-95424887205161159c	2025-08-09 16:59:32.367927
631	28	4OsJBdkrkj8RyijMOG6OR	2025-08-09 17:02:16.373502
581	25	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:52:24.089407
587	26	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:54:10.54506
355	20	5V49HdIAJsdn9K0WZkbQ4	2025-08-09 15:38:30.418464
356	19	5V49HdIAJsdn9K0WZkbQ4	2025-08-09 15:38:30.437597
591	27	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:54:52.79834
476	21	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:22:44.095484
478	22	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:23:22.53984
481	22	OFFICIAL-95424887205161159c	2025-08-09 16:24:43.389021
482	21	OFFICIAL-95424887205161159c	2025-08-09 16:24:43.390107
497	21	xYCWKrFN5PtNpeOzFvrai	2025-08-09 16:30:58.293863
498	22	xYCWKrFN5PtNpeOzFvrai	2025-08-09 16:30:58.346968
613	25	OFFICIAL-95424887205161159c	2025-08-09 16:56:22.384498
615	26	OFFICIAL-95424887205161159c	2025-08-09 16:56:22.42626
557	24	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:50:20.269199
507	23	xYCWKrFN5PtNpeOzFvrai	2025-08-09 16:35:33.789771
508	23	4OsJBdkrkj8RyijMOG6OR	2025-08-09 16:35:37.692303
509	23	S6YmYPOXvY80kOEdCuqRy	2025-08-09 16:38:43.29143
510	22	S6YmYPOXvY80kOEdCuqRy	2025-08-09 16:38:43.306808
511	21	S6YmYPOXvY80kOEdCuqRy	2025-08-09 16:38:43.358736
518	23	tIyEeq93n8rVpu3I0kPAK	2025-08-09 16:39:31.701827
519	22	tIyEeq93n8rVpu3I0kPAK	2025-08-09 16:39:31.731946
520	21	tIyEeq93n8rVpu3I0kPAK	2025-08-09 16:39:31.738911
574	24	xYCWKrFN5PtNpeOzFvrai	2025-08-09 16:51:16.510705
576	25	xYCWKrFN5PtNpeOzFvrai	2025-08-09 16:51:54.555682
\.


--
-- Data for Name: message_requests; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.message_requests (id, sender_id, receiver_id, initial_message, status, created_at, responded_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.messages (id, sender_id, recipient_id, content, is_read, message_type, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.notifications (id, user_id, from_user_id, type, title, message, related_id, related_type, is_read, created_at) FROM stdin;
17	4OsJBdkrkj8RyijMOG6OR	5V49HdIAJsdn9K0WZkbQ4	like	إعجاب جديد	أعجب DS بمنشورك	20	memory	t	2025-08-09 15:38:35.132616
18	4OsJBdkrkj8RyijMOG6OR	5V49HdIAJsdn9K0WZkbQ4	like	إعجاب جديد	أعجب DS بمنشورك	19	memory	t	2025-08-09 15:38:57.101473
19	4OsJBdkrkj8RyijMOG6OR	xYCWKrFN5PtNpeOzFvrai	like	إعجاب جديد	أعجب oms بمنشورك	22	memory	f	2025-08-09 16:31:01.376137
20	4OsJBdkrkj8RyijMOG6OR	xYCWKrFN5PtNpeOzFvrai	like	إعجاب جديد	أعجب oms بمنشورك	21	memory	f	2025-08-09 16:31:03.250828
\.


--
-- Data for Name: pet_achievements; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.pet_achievements (id, user_id, pet_id, achievement_type, achievement_value, unlocked, unlocked_at, created_at) FROM stdin;
\.


--
-- Data for Name: player_mission_progress; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.player_mission_progress (id, player_id, mission_id, current_progress, is_completed, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: player_rankings; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.player_rankings (id, user_id, game_type, total_games, total_wins, total_points_spent, total_points_won, current_level, experience, rank, last_played, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: point_packages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.point_packages (id, name, point_amount, price_in_cents, price_display, currency, bonus_points, is_popular, is_active, display_order, created_at) FROM stdin;
12	باقة البداية	400	500	$5.00	USD	16	f	t	1	2025-08-07 17:29:47.283778
13	باقة شائعة	800	1000	$10.00	USD	50	t	t	2	2025-08-07 17:29:47.283778
14	باقة رائعة	1600	2000	$20.00	USD	140	f	t	3	2025-08-07 17:29:47.283778
15	باقة متميزة	4000	5000	$50.00	USD	400	f	t	4	2025-08-07 17:29:47.283778
16	باقة ملكية	8000	10000	$100.00	USD	1000	f	t	5	2025-08-07 17:29:47.283778
17	باقة الأسطورة	16000	20000	$200.00	USD	2500	f	t	6	2025-08-07 17:29:47.283778
\.


--
-- Data for Name: point_transactions; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.point_transactions (id, user_id, amount, type, description, created_at, related_gift_id, stripe_payment_id, payment_status) FROM stdin;
1	4OsJBdkrkj8RyijMOG6OR	850	payment	شراء باقة شائعة	2025-08-07 20:36:52.5411	\N	pi_3RtaX1F5B5GPeR6G1oAFS4c6	completed
\.


--
-- Data for Name: premium_album_media; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.premium_album_media (id, album_id, media_url, media_type, caption, order_index, uploaded_at) FROM stdin;
\.


--
-- Data for Name: premium_album_purchases; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.premium_album_purchases (id, album_id, buyer_id, gift_id, gift_amount, total_cost, purchased_at) FROM stdin;
\.


--
-- Data for Name: premium_albums; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.premium_albums (id, creator_id, title, description, cover_image_url, required_gift_id, required_gift_amount, total_photos, total_views, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: premium_messages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.premium_messages (id, sender_id, recipient_id, album_id, message, is_unlocked, unlocked_at, created_at) FROM stdin;
\.


--
-- Data for Name: private_albums; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.private_albums (id, user_id, title, description, album_type, gift_required, access_price, is_active, total_photos, total_views, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: private_content_requests; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.private_content_requests (id, from_user_id, to_user_id, type, description, offered_price, status, content_url, created_at, responded_at, completed_at) FROM stdin;
\.


--
-- Data for Name: private_messages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.private_messages (id, sender_id, receiver_id, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: private_room_messages; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.private_room_messages (id, room_id, sender_id, content, message_type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: private_rooms; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.private_rooms (id, host_id, invited_user_id, title, description, gift_required, entry_price, is_active, invitation_sent, invitation_accepted, gift_paid, room_started, room_ended_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: room_invitations; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.room_invitations (id, room_id, from_user_id, to_user_id, message, gift_required, status, expires_at, responded_at, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.sessions (sid, sess, expire) FROM stdin;
4_maJGoMss15dssXtVifh4x5Xc6mwsCn	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:26:05.654Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:26:06
JXO4k54i0kU2iVzhK6_glJr6ji7Hd_7o	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T10:42:44.470Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 12:22:09
5E9ljWs0PrU8linM_bwguJhXl9LWEjqO	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:26:11.020Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:26:12
MJGVsYkJ_d9T3FGTV1XKcokWpnMKuy2u	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:43:58.464Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 09:43:59
uzhv0RQG3weu_dUXPyMFHYKXhVlLvX0C	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:41:31.545Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 09:41:32
RogiP4McTnErEKzCGV5trzFEnn9WuTbl	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T10:30:45.079Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 10:31:07
XUas4HeScLu146LeG1VpQ8hkjvfQFguU	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:49:01.533Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 09:49:03
LbgjJhNvwcKmj78S_mkRYHdGN48pO_Io	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T16:38:24.045Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 20:53:52
XDWEbM-bTbu_b4iJ6kE8UzqTQR7ksVmK	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T15:49:11.882Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 16:05:05
t_CqmZR5SeNfqKUOW-VO4AlbafNfWoOF	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T22:41:01.477Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 22:41:17
9oAFQ1dzjfNJ7p1-4aRx_IDgx1JUv_hn	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T11:43:34.988Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-14 11:43:45
tKnfVKGBZif6GirnumyowH1RWV9VWqT0	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:34:25.659Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-14 09:34:36
z1T332mJxCnFYFQ37NF0oKoOYVktTr-3	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:42:02.313Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 09:42:29
aUkE0r4c7du43Uanyti0x_g7AkcYwaOg	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T08:26:50.533Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 08:56:55
CAzj8tZ9bahZ1PCmwWCFzMOycjp0vkCJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T10:08:28.662Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OFFICIAL-95424887205161159c"}}	2025-08-14 10:29:36
fK3DqCxA8UMipZMuNwG5mjrAXbQUF1eH	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T15:56:11.283Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 15:56:45
6EDHMkqYwegvBWTdgZvex0Nd3QdKKNRS	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T17:04:07.221Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 17:04:58
jp8R-cKN-9fgChgTlLrTDDLnsxVGmZrn	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T17:38:42.876Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 17:43:19
ygsgRXJApIA9iGtY69UOX-dDjQ0jMxvn	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T09:05:04.791Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-15 09:06:08
BEB6XT46QNz5uunDCTT_R65_5GcBJQ02	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T10:01:56.099Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 10:04:25
6AkTivoXZRtz1JlHK5eeDbhUjIvBekRz	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T17:43:40.090Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 17:46:39
iWjixyo_hZcN1Az8HoIxsXqUBSKNhTfS	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T20:24:51.423Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 21:13:54
U4A2uvRh2xtRlkKfDqFJtf3WdE8q54Fj	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T17:46:55.942Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 17:46:57
AKHjCpn-19T185ICCPYxmmYRF4x3x0OG	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:35:00.600Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 09:39:21
Ljc7IlFFGkDGcFXNPfKTfcuZ_0ar3Ons	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T20:54:29.733Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 20:57:31
JMTmwhHlSEjk561fZkdXVrTJrnr4yxvu	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T21:55:41.365Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 22:00:10
FuSfL0LyqpfVn5wfPr-t1edZXwmLvT8v	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T10:04:34.766Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 10:06:00
W91phLsX6-KCnS3sqt97bB4ulEiY6Cfm	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T11:33:44.745Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 16:35:22
pM09Aq74K0njVpsLqfGLfnMHdsiUhP_W	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:44:04.174Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:44:05
zETIuHOq3MrL-yrN9wKSz9SJWGZ-ZHCq	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T14:57:07.634Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 15:29:21
IqTLbJBMe4ikBadtapYdLms0HskiU9Cv	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T17:13:46.820Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:14:41
Qp6ziEVBrCfPRw7TIWEFoTvECC7_soUg	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T21:02:53.265Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 21:03:14
30EUmvdG_52Ix224iNjK0WQVWZZ39ame	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:44:54.556Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:44:55
4LqHhZPSQ1CrrxEGhwil7PtBLXuuqxae	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:44:41.291Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 16:44:49
5VV14c0Swfs31oX4EXjAywOJDuf7QOIC	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T09:36:54.055Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OWNER-20272f7e3fcd03f5aa22"}}	2025-08-14 20:29:29
cuubKvJdPVKOkAG3lIBOIKlslkMgNYht	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T11:37:59.801Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 16:37:34
Ig7immXfa1Y69WfhwFDzfdJTc_guYYSE	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T10:08:13.889Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "-CkXUK1GWvRGlHU3u8om5"}}	2025-08-15 16:35:11
8chb5vbKEiBVV_dbPkfXVGIV-97c6ULJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T15:46:46.622Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OFFICIAL-95424887205161159c"}}	2025-08-16 16:25:29
VkwVleKv1DhJBY_B4-Q1CE3oIt4oF9T1	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T15:38:02.581Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 18:31:33
CfoihT9PiDQ-ovSbnv1Z3wImy5qBSI2w	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:03:23.093Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 16:04:59
SwKjpblHU8w5WTioDvfngohFC4mNNZ1Z	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:56:03.300Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 17:00:18
OANY7Q5u3I1xNHOTYzp435u1BT3VKyo6	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:31:34.831Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 16:49:20
5fVg0Kofbayqif59G2T-1zneX5j2oAR3	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-15T22:26:15.755Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-15 22:40:33
fC3Le4o6jLkfm1dAKa5C1ByuFLxZ-6q_	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T17:34:00.132Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 17:37:31
KtvsMUZfpWdocii0leW9FDDYFb4gpxq7	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T11:58:55.262Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 12:01:35
v-00r6Dr3GZAw3bfH_VzcRNLB1vBUR26	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:18:03.060Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 16:30:50
ycmaWaOaSLS6ID6N8e_u-dwYPusqjcNg	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-14T17:47:32.994Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-14 18:00:50
2VabAn5KiU5QT-zR_II45BzNLrBelScq	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:39:30.333Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "tIyEeq93n8rVpu3I0kPAK"}}	2025-08-16 16:40:09
a8DB8xPPrfQvaz4BxP_vKwfdnIsm512r	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T12:52:28.952Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 12:52:37
8exEkHAY1osDbA_Gj9W7qsWynnPEaWme	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T12:01:51.391Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 12:11:57
iNXJBaWewteHYj967XCfyIxPdR6On-YO	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T15:50:38.133Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OFFICIAL-95424887205161159c"}}	2025-08-16 15:55:52
vhW04JqvpmpZ4huE3ErMvHjF7A9baTPP	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:26:18.254Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:03:29
NVT5-PH0as-8XE1hrmRyODufPwzKaeXT	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T15:58:30.109Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 15:58:58
JsWcmldWlDdoYXm1SlRVcnL4dU7IXr4X	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:12:53.274Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 16:13:53
ifVY0yT46kc5ebTFiXYMIZrP-7SXq7zO	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:23:56.527Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 19:32:35
mfovFhsYs4sKApFiJVmGeJea3jZ5Mcyd	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:56:21.207Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "OFFICIAL-95424887205161159c"}}	2025-08-16 17:13:24
59as2TbbdLGIjO5Wes2-6B2esJ-z6_ii	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:45:04.247Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 16:50:34
mpUXB2PQOvDOMhiGHP25ngtxMN_OFDPm	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:44:29.810Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:44:30
nXzA5W_TtZK2oyCLQekeIICm3zX-tdem	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T17:04:24.666Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:21:53
HCyscoR7qlNicmkS6hkVyuZyJiwVa9l5	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T16:38:42.068Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "S6YmYPOXvY80kOEdCuqRy"}}	2025-08-16 16:50:02
xCiVIMbnLiHlxmA60_MSMuNLtYW2K1sU	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T17:05:41.884Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:08:00
F0iQ4G_ynhszfep8XKdb5pHkhpXXNnI0	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:00:54.925Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:00:55
Uq80F3RYvgaXRXOCI-nNi1RhY_Cqydn0	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:02:58.243Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:02:59
_b6RSrACiyRZ9bL5k8SuyVlwKQNg86rX	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:03:12.984Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:03:13
7dNTX2ShFPVy-eEjSGVZgutnly7W4Erk	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:03:32.315Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:03:33
EOClZCjby8DSJ4BIU00XEqiho53kOcVQ	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:27:29.361Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 19:27:30
2wpqkeTOfW7cWZuC8Cf4ODVDmu9jnh-7	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:19:19.314Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:19:20
VOc4o7p8Nl-0PLQVRNkq9_P-AWUf_E0x	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:19:19.497Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:19:20
DHfF_735Lr6vm6qxNzHGSeqg1IsEZNJC	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T17:15:15.753Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:16:00
IMY1phvZXEWyEyUZm0hOkh9wpjrwHkit	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:26:26.136Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 20:04:54
xJtFFAm5wiRFS2On_a1ztInriGkwOK21	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:19:59.940Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:20:00
e2A0aB9DYY1PYFuStUXcQ6tu7fLsCrLz	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:21:32.444Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:21:33
oRB5mjb5f6DjG6PyxDLkc7Awoux3fwJK	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T20:29:58.907Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 20:29:59
gnEKxu4xdwDKfqnUr6dJtkWUKzkzQdU0	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T17:27:10.519Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:32:42
UxhdnsB6MGs3IRcpGe63Y7XEpMHeHisr	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:24:22.033Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 19:24:23
JsMBgYc9Gwkx1c17YTvqeF6nn6dSkkVb	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T17:44:39.018Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 17:44:58
LvFXRCLJvabUjelzYw4Bume7HvYc_yQl	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:24:39.659Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:24:40
YH3QRLFsCibfsZa7xY4pzMFiODznoDb-	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:24:39.086Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:24:40
6SebjM1Uu_ojK67_DPSATvaHvQQlAP1U	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:24:39.101Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-08-16 19:24:40
SorBUynE6NVGEi_rIDQ8ycKKtXwRd1Mz	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:24:39.411Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 19:24:40
1NCQs_KUYG03CDCOcZDvELKAo1CUZZ-e	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-16T19:25:24.628Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "4OsJBdkrkj8RyijMOG6OR"}}	2025-08-16 19:25:25
\.


--
-- Data for Name: streams; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.streams (id, host_id, title, description, category, thumbnail_url, is_live, viewer_count, total_gifts, started_at, ended_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_character_items; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.user_character_items (id, user_id, item_id, quantity, purchased_at) FROM stdin;
\.


--
-- Data for Name: user_characters; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.user_characters (id, user_id, character_id, level, experience, current_stats, equipment, customization, purchased_at, last_used) FROM stdin;
\.


--
-- Data for Name: user_inventory; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.user_inventory (id, user_id, item_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.user_profiles (id, user_id, bio, favorite_game, garden_theme, total_support_received, total_support_given, garden_level, garden_experience, is_public, allow_visitors, allow_gifts, customizations, achievements, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_wallets; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.user_wallets (id, user_id, total_earnings, available_balance, total_withdrawn, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.users (id, email, first_name, last_name, profile_image_url, username, bio, points, total_earnings, is_streamer, is_admin, created_at, updated_at, role, is_private_account, allow_direct_messages, allow_gifts_from_strangers, password_hash, show_last_seen, last_seen_at, is_online, last_activity_at, online_status_updated_at, total_gifts_received, total_gifts_sent, supporter_level, supporter_badge, cover_image_url, country_code, country_name, country_flag, is_verified, verified_email, verification_badge, verified_at, mfa_secret, mfa_enabled, mfa_backup_codes, mfa_enabled_at, password_reset_token, password_reset_expiry, date_of_birth) FROM stdin;
tIyEeq93n8rVpu3I0kPAK	anaamd389@gmail.com	Zain 	Ahmad 	\N	zaino	\N	0	0.00	f	f	2025-08-09 16:39:06.193357	2025-08-09 16:39:06.193357	user	f	t	t	$2b$12$SU8et1bEing3ANGlwgAIeOIjdj1vlfEuS0HQkJDvrZ7ltU2baDuTG	t	2025-08-09 16:40:08.371	f	2025-08-09 16:40:08.371	2025-08-09 16:45:09.129	0.00	0.00	0	\N	\N	EG	Egypt	🇪🇬	f	\N	LaaBoBo	\N	\N	f	\N	\N	\N	\N	2003-08-09 00:00:00
xYCWKrFN5PtNpeOzFvrai	asad4@gmail.com	oms	SY	/uploads/1754758288164-8t5m6i.png	sor58	\N	0	0.00	f	f	2025-08-09 16:30:22.798233	2025-08-09 16:30:22.798233	user	f	t	t	$2b$12$YIaq/Qcpc0aUNvFMaJt0Y.ZFWBsjIShG0GG8Y5CkHEccnRqQtxNlG	t	2025-08-09 16:52:04.092	f	2025-08-09 16:52:04.092	2025-08-09 16:57:15.567	0.00	0.00	0	\N	/uploads/1754758291321-tlmrq.jpg	LB	Lebanon	🇱🇧	f	\N	LaaBoBo	\N	\N	f	\N	\N	\N	\N	1997-08-09 00:00:00
5V49HdIAJsdn9K0WZkbQ4	asaad11asaad18@gmail.com	DS	DS	\N	Ds512	\N	0	0.00	f	f	2025-08-09 15:38:19.603517	2025-08-09 15:38:19.603517	user	f	t	t	$2b$12$SHmKlrE06Orm39G2nhnV2.tROLk4NJlukucX75XHHd7rXd2LwRpVa	t	2025-08-09 16:17:46.447	f	2025-08-09 16:17:46.447	2025-08-09 16:23:09.129	0.00	0.00	0	\N	\N	AE	United Arab Emirates	🇦🇪	f	\N	LaaBoBo	\N	\N	f	\N	\N	\N	\N	2002-09-11 00:00:00
OWNER-20272f7e3fcd03f5aa22	fnnm945@gmail.com	System	Owner	\N	LaaBoBo_Owner	\N	50000	0.00	f	t	2025-08-07 09:23:41.306766	2025-08-08 08:52:43.298	super_admin	f	t	t	$2b$12$5ecQU2GHeuW6ahyGp8Liwu6x6mblj9bG3mMphrrzISlKaMypjS3Lq	t	2025-08-07 10:52:15.588	f	2025-08-07 10:52:15.588	2025-08-07 10:57:19.988	0.00	0.00	0	\N	\N	\N	\N	\N	t	\N	LaaBoBo	2025-08-07 09:23:41.306766	\N	f	\N	\N	57e12ce2290a877605290954b17d7a8402a0816987fb65e0d894343e2d58dd06	2025-08-08T09:52:43.298Z	\N
-CkXUK1GWvRGlHU3u8om5	asaad11asaad90@gmail.com	asaa	so	\N	asaad1111	\N	0	0.00	f	f	2025-08-07 15:54:00.756544	2025-08-07 15:54:00.756544	user	f	t	t	$2b$12$Uk./B/NABH/6/71xG41ImemuU399nP2qGWIsVzJkWfIOqGtkWs2SW	t	2025-08-08 16:35:10.659	f	2025-08-08 16:35:10.659	2025-08-08 16:41:56.265	0.00	0.00	0	\N	\N	\N	\N	\N	f	\N	LaaBoBo	\N	\N	f	\N	\N	\N	\N	\N
Q4C26soOmXkaJSnbrRGXi	asaad11asaad44@gmail.com	asaad	asaad	\N	edndn	\N	0	0.00	f	f	2025-08-07 14:37:30.017556	2025-08-07 14:37:30.017556	user	f	t	t	$2b$12$udxZammEMCY4qQME9hmfGO9q1Mb0ZvUW0xbujz3HBc0z85LCDfni.	t	2025-08-07 14:37:30.017556	f	2025-08-07 14:37:30.017556	2025-08-07 14:37:30.017556	0.00	0.00	0	\N	\N	\N	\N	\N	f	\N	LaaBoBo	\N	\N	f	\N	\N	\N	\N	\N
S6YmYPOXvY80kOEdCuqRy	mahmoudmabrouk28@gmail.com	Rosy 	Dream	\N	RosyDream	\N	0	0.00	f	f	2025-08-09 16:38:33.107041	2025-08-09 16:38:33.107041	user	f	t	t	$2b$12$xgnQ7hHnAsEyKpmwlupmiOwBv6FIkwn2J6LjnAqTqefEMVqiafhnq	t	2025-08-09 16:50:01.096	f	2025-08-09 16:50:01.096	2025-08-09 16:55:15.566	0.00	0.00	0	\N	\N	EG	Egypt	🇪🇬	f	\N	LaaBoBo	\N	\N	f	\N	\N	\N	\N	1988-06-20 00:00:00
OFFICIAL-95424887205161159c	fnnm945sas@gmail.com	LaaBoBo	Official	/uploads/1754758598157-wl9bd.png	LaaBoBo	LaaBoBo 🌸 | منصة التواصل الاجتماعي | مكان آمن للذكريات والتواصل 💫	100000	0.00	f	f	2025-08-07 09:23:44.63035	2025-08-07 12:01:50.937	user	f	t	t	$2b$10$K6oEBXDRoSPFIiDJlsjnDuBYCyD1oLAWyGEbi8VYqRb50UFCBkIHa	t	2025-08-09 17:13:23.029	f	2025-08-09 17:13:23.029	2025-08-09 17:19:46.959	0.00	0.00	0	\N	/uploads/1754758611274-g4jp6.png	\N	\N	\N	t	\N	LaaBoBo	2025-08-07 09:23:44.63035	\N	f	\N	\N	vsafqxv99qwfn7hsbijok	2025-08-07T13:01:50.937Z	\N
4OsJBdkrkj8RyijMOG6OR	asaad11asaad98@gmail.com	ali	ali	/uploads/1754767816424-ohkxd4.jpg	asaad111	\N	950	0.00	f	f	2025-08-07 10:40:02.784002	2025-08-07 20:36:52.436	user	f	t	t	$2b$12$FPuLgU.HokDJmsK9IiNFfOXoRExgx8OXKFnV/G/WWPKt0cVxJ73cG	t	2025-08-09 19:45:35.669	f	2025-08-09 19:45:35.669	2025-08-09 19:51:41.783	0.00	0.00	0	\N	/uploads/1754767600585-r0e2rm.jpg	\N	\N	\N	f	\N	LaaBoBo	\N	\N	f	\N	\N	fixxwqn1jlqg4r7lgd1k28	2025-08-07T13:05:38.170Z	\N
\.


--
-- Data for Name: virtual_pets; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.virtual_pets (id, user_id, name, type, health, happiness, level, experience, last_fed, last_played, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: voice_chat_participants; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.voice_chat_participants (id, chat_room_id, user_id, is_muted, is_deafened, joined_at, left_at) FROM stdin;
\.


--
-- Data for Name: voice_chat_rooms; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.voice_chat_rooms (id, game_room_id, is_active, max_participants, current_participants, created_at) FROM stdin;
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: laabobo_user
--

COPY public.wallet_transactions (id, user_id, amount, type, description, gift_id, created_at, related_user_id, related_album_id, related_photo_id, status) FROM stdin;
\.


--
-- Name: album_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.album_access_id_seq', 1, false);


--
-- Name: album_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.album_photos_id_seq', 1, false);


--
-- Name: alliance_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.alliance_members_id_seq', 1, false);


--
-- Name: alliances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.alliances_id_seq', 1, false);


--
-- Name: blocked_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.blocked_users_id_seq', 2, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 49, true);


--
-- Name: city_zones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.city_zones_id_seq', 1, false);


--
-- Name: comment_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.comment_likes_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.comments_id_seq', 7, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.conversations_id_seq', 2, true);


--
-- Name: daily_missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.daily_missions_id_seq', 1, false);


--
-- Name: followers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.followers_id_seq', 15, true);


--
-- Name: fragment_collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.fragment_collections_id_seq', 1, false);


--
-- Name: gift_characters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.gift_characters_id_seq', 38, true);


--
-- Name: gifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.gifts_id_seq', 19, true);


--
-- Name: group_room_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.group_room_messages_id_seq', 1, false);


--
-- Name: group_room_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.group_room_participants_id_seq', 2, true);


--
-- Name: group_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.group_rooms_id_seq', 2, true);


--
-- Name: memory_collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.memory_collections_id_seq', 1, false);


--
-- Name: memory_fragments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.memory_fragments_id_seq', 28, true);


--
-- Name: memory_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.memory_interactions_id_seq', 34, true);


--
-- Name: memory_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.memory_views_id_seq', 800, true);


--
-- Name: message_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.message_requests_id_seq', 2, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.messages_id_seq', 70, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.notifications_id_seq', 20, true);


--
-- Name: player_mission_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.player_mission_progress_id_seq', 1, false);


--
-- Name: point_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.point_packages_id_seq', 17, true);


--
-- Name: point_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.point_transactions_id_seq', 1, true);


--
-- Name: premium_album_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.premium_album_media_id_seq', 4, true);


--
-- Name: premium_album_purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.premium_album_purchases_id_seq', 15, true);


--
-- Name: premium_albums_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.premium_albums_id_seq', 5, true);


--
-- Name: premium_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.premium_messages_id_seq', 1, false);


--
-- Name: private_albums_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.private_albums_id_seq', 1, false);


--
-- Name: private_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.private_messages_id_seq', 1, false);


--
-- Name: private_room_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.private_room_messages_id_seq', 1, false);


--
-- Name: private_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.private_rooms_id_seq', 1, false);


--
-- Name: room_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.room_invitations_id_seq', 1, false);


--
-- Name: streams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.streams_id_seq', 100, true);


--
-- Name: user_wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.user_wallets_id_seq', 2, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: laabobo_user
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 1, false);


--
-- Name: album_access album_access_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_access
    ADD CONSTRAINT album_access_pkey PRIMARY KEY (id);


--
-- Name: album_photos album_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_photos
    ADD CONSTRAINT album_photos_pkey PRIMARY KEY (id);


--
-- Name: album_purchases album_purchases_album_id_buyer_id_unique; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_purchases
    ADD CONSTRAINT album_purchases_album_id_buyer_id_unique UNIQUE (album_id, buyer_id);


--
-- Name: album_purchases album_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_purchases
    ADD CONSTRAINT album_purchases_pkey PRIMARY KEY (id);


--
-- Name: alliance_members alliance_members_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT alliance_members_pkey PRIMARY KEY (id);


--
-- Name: alliances alliances_name_unique; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_name_unique UNIQUE (name);


--
-- Name: alliances alliances_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_pkey PRIMARY KEY (id);


--
-- Name: blocked_users blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (id);


--
-- Name: character_items character_items_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.character_items
    ADD CONSTRAINT character_items_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: city_zones city_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.city_zones
    ADD CONSTRAINT city_zones_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: daily_missions daily_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT daily_missions_pkey PRIMARY KEY (id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (id);


--
-- Name: fragment_collections fragment_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.fragment_collections
    ADD CONSTRAINT fragment_collections_pkey PRIMARY KEY (id);


--
-- Name: game_characters game_characters_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_characters
    ADD CONSTRAINT game_characters_pkey PRIMARY KEY (id);


--
-- Name: game_participants game_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_pkey PRIMARY KEY (id);


--
-- Name: game_rooms game_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_rooms
    ADD CONSTRAINT game_rooms_pkey PRIMARY KEY (id);


--
-- Name: garden_activities garden_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_activities
    ADD CONSTRAINT garden_activities_pkey PRIMARY KEY (id);


--
-- Name: garden_items garden_items_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_items
    ADD CONSTRAINT garden_items_pkey PRIMARY KEY (id);


--
-- Name: garden_support garden_support_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_support
    ADD CONSTRAINT garden_support_pkey PRIMARY KEY (id);


--
-- Name: garden_visits garden_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_visits
    ADD CONSTRAINT garden_visits_pkey PRIMARY KEY (id);


--
-- Name: gift_characters gift_characters_name_unique; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gift_characters
    ADD CONSTRAINT gift_characters_name_unique UNIQUE (name);


--
-- Name: gift_characters gift_characters_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gift_characters
    ADD CONSTRAINT gift_characters_pkey PRIMARY KEY (id);


--
-- Name: gifts gifts_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_pkey PRIMARY KEY (id);


--
-- Name: group_room_messages group_room_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_messages
    ADD CONSTRAINT group_room_messages_pkey PRIMARY KEY (id);


--
-- Name: group_room_participants group_room_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_participants
    ADD CONSTRAINT group_room_participants_pkey PRIMARY KEY (id);


--
-- Name: group_rooms group_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_rooms
    ADD CONSTRAINT group_rooms_pkey PRIMARY KEY (id);


--
-- Name: locked_album_content locked_album_content_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.locked_album_content
    ADD CONSTRAINT locked_album_content_pkey PRIMARY KEY (id);


--
-- Name: locked_albums locked_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.locked_albums
    ADD CONSTRAINT locked_albums_pkey PRIMARY KEY (id);


--
-- Name: memory_collections memory_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_collections
    ADD CONSTRAINT memory_collections_pkey PRIMARY KEY (id);


--
-- Name: memory_fragments memory_fragments_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_fragments
    ADD CONSTRAINT memory_fragments_pkey PRIMARY KEY (id);


--
-- Name: memory_interactions memory_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_interactions
    ADD CONSTRAINT memory_interactions_pkey PRIMARY KEY (id);


--
-- Name: memory_views memory_views_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_views
    ADD CONSTRAINT memory_views_pkey PRIMARY KEY (id);


--
-- Name: memory_views memory_views_unique_user_memory; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_views
    ADD CONSTRAINT memory_views_unique_user_memory UNIQUE (memory_id, viewer_id);


--
-- Name: message_requests message_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.message_requests
    ADD CONSTRAINT message_requests_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pet_achievements pet_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.pet_achievements
    ADD CONSTRAINT pet_achievements_pkey PRIMARY KEY (id);


--
-- Name: player_mission_progress player_mission_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.player_mission_progress
    ADD CONSTRAINT player_mission_progress_pkey PRIMARY KEY (id);


--
-- Name: player_rankings player_rankings_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.player_rankings
    ADD CONSTRAINT player_rankings_pkey PRIMARY KEY (id);


--
-- Name: point_packages point_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.point_packages
    ADD CONSTRAINT point_packages_pkey PRIMARY KEY (id);


--
-- Name: point_transactions point_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_pkey PRIMARY KEY (id);


--
-- Name: premium_album_media premium_album_media_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_media
    ADD CONSTRAINT premium_album_media_pkey PRIMARY KEY (id);


--
-- Name: premium_album_purchases premium_album_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_purchases
    ADD CONSTRAINT premium_album_purchases_pkey PRIMARY KEY (id);


--
-- Name: premium_albums premium_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_albums
    ADD CONSTRAINT premium_albums_pkey PRIMARY KEY (id);


--
-- Name: premium_messages premium_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_messages
    ADD CONSTRAINT premium_messages_pkey PRIMARY KEY (id);


--
-- Name: private_albums private_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_albums
    ADD CONSTRAINT private_albums_pkey PRIMARY KEY (id);


--
-- Name: private_content_requests private_content_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_content_requests
    ADD CONSTRAINT private_content_requests_pkey PRIMARY KEY (id);


--
-- Name: private_messages private_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_pkey PRIMARY KEY (id);


--
-- Name: private_room_messages private_room_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_room_messages
    ADD CONSTRAINT private_room_messages_pkey PRIMARY KEY (id);


--
-- Name: private_rooms private_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_rooms
    ADD CONSTRAINT private_rooms_pkey PRIMARY KEY (id);


--
-- Name: room_invitations room_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.room_invitations
    ADD CONSTRAINT room_invitations_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: streams streams_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_pkey PRIMARY KEY (id);


--
-- Name: user_character_items user_character_items_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_character_items
    ADD CONSTRAINT user_character_items_pkey PRIMARY KEY (id);


--
-- Name: user_characters user_characters_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_characters
    ADD CONSTRAINT user_characters_pkey PRIMARY KEY (id);


--
-- Name: user_inventory user_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_inventory
    ADD CONSTRAINT user_inventory_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_pkey PRIMARY KEY (id);


--
-- Name: user_wallets user_wallets_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_user_id_unique UNIQUE (user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: virtual_pets virtual_pets_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.virtual_pets
    ADD CONSTRAINT virtual_pets_pkey PRIMARY KEY (id);


--
-- Name: voice_chat_participants voice_chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.voice_chat_participants
    ADD CONSTRAINT voice_chat_participants_pkey PRIMARY KEY (id);


--
-- Name: voice_chat_rooms voice_chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.voice_chat_rooms
    ADD CONSTRAINT voice_chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: laabobo_user
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: memory_views_memory_viewer_idx; Type: INDEX; Schema: public; Owner: laabobo_user
--

CREATE INDEX memory_views_memory_viewer_idx ON public.memory_views USING btree (memory_id, viewer_id);


--
-- Name: album_access album_access_album_id_private_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_access
    ADD CONSTRAINT album_access_album_id_private_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.private_albums(id);


--
-- Name: album_access album_access_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_access
    ADD CONSTRAINT album_access_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: album_access album_access_photo_id_album_photos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_access
    ADD CONSTRAINT album_access_photo_id_album_photos_id_fk FOREIGN KEY (photo_id) REFERENCES public.album_photos(id);


--
-- Name: album_access album_access_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_access
    ADD CONSTRAINT album_access_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: album_photos album_photos_album_id_private_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_photos
    ADD CONSTRAINT album_photos_album_id_private_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.private_albums(id);


--
-- Name: album_purchases album_purchases_album_id_locked_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_purchases
    ADD CONSTRAINT album_purchases_album_id_locked_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.locked_albums(id) ON DELETE CASCADE;


--
-- Name: album_purchases album_purchases_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.album_purchases
    ADD CONSTRAINT album_purchases_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: alliance_members alliance_members_alliance_id_alliances_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT alliance_members_alliance_id_alliances_id_fk FOREIGN KEY (alliance_id) REFERENCES public.alliances(id);


--
-- Name: alliance_members alliance_members_member_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT alliance_members_member_id_users_id_fk FOREIGN KEY (member_id) REFERENCES public.users(id);


--
-- Name: alliances alliances_leader_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_leader_id_users_id_fk FOREIGN KEY (leader_id) REFERENCES public.users(id);


--
-- Name: blocked_users blocked_users_blocked_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_users_id_fk FOREIGN KEY (blocked_id) REFERENCES public.users(id);


--
-- Name: blocked_users blocked_users_blocker_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_users_id_fk FOREIGN KEY (blocker_id) REFERENCES public.users(id);


--
-- Name: chat_messages chat_messages_stream_id_streams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_stream_id_streams_id_fk FOREIGN KEY (stream_id) REFERENCES public.streams(id);


--
-- Name: chat_messages chat_messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comment_likes comment_likes_comment_id_comments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_comments_id_fk FOREIGN KEY (comment_id) REFERENCES public.comments(id);


--
-- Name: comment_likes comment_likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comments comments_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_user1_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user1_id_users_id_fk FOREIGN KEY (user1_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_user2_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user2_id_users_id_fk FOREIGN KEY (user2_id) REFERENCES public.users(id);


--
-- Name: followers followers_followed_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_followed_id_users_id_fk FOREIGN KEY (followed_id) REFERENCES public.users(id);


--
-- Name: followers followers_follower_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_id_users_id_fk FOREIGN KEY (follower_id) REFERENCES public.users(id);


--
-- Name: fragment_collections fragment_collections_collection_id_memory_collections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.fragment_collections
    ADD CONSTRAINT fragment_collections_collection_id_memory_collections_id_fk FOREIGN KEY (collection_id) REFERENCES public.memory_collections(id);


--
-- Name: fragment_collections fragment_collections_fragment_id_memory_fragments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.fragment_collections
    ADD CONSTRAINT fragment_collections_fragment_id_memory_fragments_id_fk FOREIGN KEY (fragment_id) REFERENCES public.memory_fragments(id);


--
-- Name: game_participants game_participants_pet_id_virtual_pets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_pet_id_virtual_pets_id_fk FOREIGN KEY (pet_id) REFERENCES public.virtual_pets(id);


--
-- Name: game_participants game_participants_room_id_game_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_room_id_game_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.game_rooms(id);


--
-- Name: game_participants game_participants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: game_rooms game_rooms_host_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.game_rooms
    ADD CONSTRAINT game_rooms_host_id_users_id_fk FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- Name: garden_activities garden_activities_pet_id_virtual_pets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_activities
    ADD CONSTRAINT garden_activities_pet_id_virtual_pets_id_fk FOREIGN KEY (pet_id) REFERENCES public.virtual_pets(id);


--
-- Name: garden_activities garden_activities_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_activities
    ADD CONSTRAINT garden_activities_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: garden_support garden_support_garden_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_support
    ADD CONSTRAINT garden_support_garden_owner_id_users_id_fk FOREIGN KEY (garden_owner_id) REFERENCES public.users(id);


--
-- Name: garden_support garden_support_supporter_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_support
    ADD CONSTRAINT garden_support_supporter_id_users_id_fk FOREIGN KEY (supporter_id) REFERENCES public.users(id);


--
-- Name: garden_visits garden_visits_host_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_visits
    ADD CONSTRAINT garden_visits_host_id_users_id_fk FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- Name: garden_visits garden_visits_pet_id_virtual_pets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_visits
    ADD CONSTRAINT garden_visits_pet_id_virtual_pets_id_fk FOREIGN KEY (pet_id) REFERENCES public.virtual_pets(id);


--
-- Name: garden_visits garden_visits_visitor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.garden_visits
    ADD CONSTRAINT garden_visits_visitor_id_users_id_fk FOREIGN KEY (visitor_id) REFERENCES public.users(id);


--
-- Name: gifts gifts_character_id_gift_characters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_character_id_gift_characters_id_fk FOREIGN KEY (character_id) REFERENCES public.gift_characters(id);


--
-- Name: gifts gifts_memory_id_memory_fragments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_memory_id_memory_fragments_id_fk FOREIGN KEY (memory_id) REFERENCES public.memory_fragments(id);


--
-- Name: gifts gifts_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: gifts gifts_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: gifts gifts_stream_id_streams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_stream_id_streams_id_fk FOREIGN KEY (stream_id) REFERENCES public.streams(id);


--
-- Name: group_room_messages group_room_messages_room_id_group_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_messages
    ADD CONSTRAINT group_room_messages_room_id_group_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.group_rooms(id);


--
-- Name: group_room_messages group_room_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_messages
    ADD CONSTRAINT group_room_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: group_room_participants group_room_participants_room_id_group_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_participants
    ADD CONSTRAINT group_room_participants_room_id_group_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.group_rooms(id);


--
-- Name: group_room_participants group_room_participants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_room_participants
    ADD CONSTRAINT group_room_participants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: group_rooms group_rooms_host_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.group_rooms
    ADD CONSTRAINT group_rooms_host_id_users_id_fk FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- Name: locked_album_content locked_album_content_album_id_locked_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.locked_album_content
    ADD CONSTRAINT locked_album_content_album_id_locked_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.locked_albums(id) ON DELETE CASCADE;


--
-- Name: locked_albums locked_albums_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.locked_albums
    ADD CONSTRAINT locked_albums_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: memory_collections memory_collections_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_collections
    ADD CONSTRAINT memory_collections_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: memory_fragments memory_fragments_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_fragments
    ADD CONSTRAINT memory_fragments_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: memory_interactions memory_interactions_fragment_id_memory_fragments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_interactions
    ADD CONSTRAINT memory_interactions_fragment_id_memory_fragments_id_fk FOREIGN KEY (fragment_id) REFERENCES public.memory_fragments(id);


--
-- Name: memory_interactions memory_interactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_interactions
    ADD CONSTRAINT memory_interactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: memory_views memory_views_memory_id_memory_fragments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_views
    ADD CONSTRAINT memory_views_memory_id_memory_fragments_id_fk FOREIGN KEY (memory_id) REFERENCES public.memory_fragments(id) ON DELETE CASCADE;


--
-- Name: memory_views memory_views_viewer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.memory_views
    ADD CONSTRAINT memory_views_viewer_id_users_id_fk FOREIGN KEY (viewer_id) REFERENCES public.users(id);


--
-- Name: message_requests message_requests_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.message_requests
    ADD CONSTRAINT message_requests_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: message_requests message_requests_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.message_requests
    ADD CONSTRAINT message_requests_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: messages messages_recipient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pet_achievements pet_achievements_pet_id_virtual_pets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.pet_achievements
    ADD CONSTRAINT pet_achievements_pet_id_virtual_pets_id_fk FOREIGN KEY (pet_id) REFERENCES public.virtual_pets(id);


--
-- Name: pet_achievements pet_achievements_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.pet_achievements
    ADD CONSTRAINT pet_achievements_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: player_mission_progress player_mission_progress_mission_id_daily_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.player_mission_progress
    ADD CONSTRAINT player_mission_progress_mission_id_daily_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.daily_missions(id);


--
-- Name: player_mission_progress player_mission_progress_player_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.player_mission_progress
    ADD CONSTRAINT player_mission_progress_player_id_users_id_fk FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- Name: player_rankings player_rankings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.player_rankings
    ADD CONSTRAINT player_rankings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: point_transactions point_transactions_related_gift_id_gifts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_related_gift_id_gifts_id_fk FOREIGN KEY (related_gift_id) REFERENCES public.gifts(id);


--
-- Name: point_transactions point_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: premium_album_media premium_album_media_album_id_premium_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_media
    ADD CONSTRAINT premium_album_media_album_id_premium_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.premium_albums(id) ON DELETE CASCADE;


--
-- Name: premium_album_purchases premium_album_purchases_album_id_premium_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_purchases
    ADD CONSTRAINT premium_album_purchases_album_id_premium_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.premium_albums(id) ON DELETE CASCADE;


--
-- Name: premium_album_purchases premium_album_purchases_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_purchases
    ADD CONSTRAINT premium_album_purchases_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: premium_album_purchases premium_album_purchases_gift_id_gifts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_album_purchases
    ADD CONSTRAINT premium_album_purchases_gift_id_gifts_id_fk FOREIGN KEY (gift_id) REFERENCES public.gifts(id);


--
-- Name: premium_albums premium_albums_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_albums
    ADD CONSTRAINT premium_albums_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: premium_albums premium_albums_required_gift_id_gifts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_albums
    ADD CONSTRAINT premium_albums_required_gift_id_gifts_id_fk FOREIGN KEY (required_gift_id) REFERENCES public.gifts(id);


--
-- Name: premium_messages premium_messages_album_id_premium_albums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_messages
    ADD CONSTRAINT premium_messages_album_id_premium_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.premium_albums(id) ON DELETE CASCADE;


--
-- Name: premium_messages premium_messages_recipient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_messages
    ADD CONSTRAINT premium_messages_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: premium_messages premium_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.premium_messages
    ADD CONSTRAINT premium_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: private_albums private_albums_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_albums
    ADD CONSTRAINT private_albums_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: private_content_requests private_content_requests_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_content_requests
    ADD CONSTRAINT private_content_requests_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: private_content_requests private_content_requests_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_content_requests
    ADD CONSTRAINT private_content_requests_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: private_messages private_messages_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: private_messages private_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: private_room_messages private_room_messages_room_id_private_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_room_messages
    ADD CONSTRAINT private_room_messages_room_id_private_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.private_rooms(id);


--
-- Name: private_room_messages private_room_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_room_messages
    ADD CONSTRAINT private_room_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: private_rooms private_rooms_host_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_rooms
    ADD CONSTRAINT private_rooms_host_id_users_id_fk FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- Name: private_rooms private_rooms_invited_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.private_rooms
    ADD CONSTRAINT private_rooms_invited_user_id_users_id_fk FOREIGN KEY (invited_user_id) REFERENCES public.users(id);


--
-- Name: room_invitations room_invitations_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.room_invitations
    ADD CONSTRAINT room_invitations_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: room_invitations room_invitations_room_id_private_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.room_invitations
    ADD CONSTRAINT room_invitations_room_id_private_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.private_rooms(id);


--
-- Name: room_invitations room_invitations_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.room_invitations
    ADD CONSTRAINT room_invitations_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: streams streams_host_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_host_id_users_id_fk FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- Name: user_character_items user_character_items_item_id_character_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_character_items
    ADD CONSTRAINT user_character_items_item_id_character_items_id_fk FOREIGN KEY (item_id) REFERENCES public.character_items(id);


--
-- Name: user_character_items user_character_items_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_character_items
    ADD CONSTRAINT user_character_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_characters user_characters_character_id_game_characters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_characters
    ADD CONSTRAINT user_characters_character_id_game_characters_id_fk FOREIGN KEY (character_id) REFERENCES public.game_characters(id);


--
-- Name: user_characters user_characters_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_characters
    ADD CONSTRAINT user_characters_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_inventory user_inventory_item_id_garden_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_inventory
    ADD CONSTRAINT user_inventory_item_id_garden_items_id_fk FOREIGN KEY (item_id) REFERENCES public.garden_items(id);


--
-- Name: user_inventory user_inventory_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_inventory
    ADD CONSTRAINT user_inventory_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_profiles user_profiles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_wallets user_wallets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: virtual_pets virtual_pets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.virtual_pets
    ADD CONSTRAINT virtual_pets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: voice_chat_participants voice_chat_participants_chat_room_id_voice_chat_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.voice_chat_participants
    ADD CONSTRAINT voice_chat_participants_chat_room_id_voice_chat_rooms_id_fk FOREIGN KEY (chat_room_id) REFERENCES public.voice_chat_rooms(id);


--
-- Name: voice_chat_participants voice_chat_participants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.voice_chat_participants
    ADD CONSTRAINT voice_chat_participants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: voice_chat_rooms voice_chat_rooms_game_room_id_game_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.voice_chat_rooms
    ADD CONSTRAINT voice_chat_rooms_game_room_id_game_rooms_id_fk FOREIGN KEY (game_room_id) REFERENCES public.game_rooms(id);


--
-- Name: wallet_transactions wallet_transactions_gift_id_gifts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_gift_id_gifts_id_fk FOREIGN KEY (gift_id) REFERENCES public.gifts(id);


--
-- Name: wallet_transactions wallet_transactions_related_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_related_user_id_users_id_fk FOREIGN KEY (related_user_id) REFERENCES public.users(id);


--
-- Name: wallet_transactions wallet_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: laabobo_user
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

