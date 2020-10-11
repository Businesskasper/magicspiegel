export class Agency {

    public agency_id: number;
    public agency_name: string;
    public agency_url: string;
    public agency_timezone: string;
    public agency_lang: string;
    public agency_phone: string;
    public agency_fare_url: string;
}

export class CalendarDates {

    public service_id: number;
    public date: Date;
    public exception_type: number;
}

export class FeedInfo {

    public feed_publisher_name: string;
    public feed_publisher_url: string;
    public feed_lang: string;
    public feed_version: string;
}

export class Routes {

    public agency_id: number;
    public route_id: number;
    public route_short_name: number;
    public route_long_name: string;
    public route_type: number;
    public route_color: string;
    public route_text_color: string;
}

export class Stops {
    
    public stop_id: number;
    public stop_code: number;
    public stop_name: string;
    public stop_lat: string;
    public stop_lon: string;
    public wheelchair_boarding: boolean;
}

export class StopTimes {

    public trip_id: number;
    public stop_id: number;
    public arrival_time: Date;
    public departure_time: Date;
    public stop_sequence: number;
}

export class Trips {
    
    public route_id: number;
    public trip_id: number;
    public service_id: number;
}

export function GtfsTypeMap(): Map<string, any> {

    let map = new Map<string, any>();

    map.set("agency", { agency_id: Number, agency_name: String, agency_url: String, agency_timezone: String, agency_lang: String, agency_phone: String, agency_fare_url: String });
    map.set("calendar_dates", { service_id: Number, date: Date, exception_type: Number });
    map.set("feed_info", { feed_publisher_name: String, feed_publisher_url: String, feed_lang: String, feed_version: Date });
    map.set("routes", { agency_id: Number, route_id: Number, route_short_name: String, route_long_name: String, route_type: Number, route_color: String, route_text_color: String });
    map.set("stops", { stop_id: Number, stop_code: Number, stop_name: String, stop_lat: String, stop_lon: String, wheelchair_boarding: Boolean });
    map.set("stop_times", { trip_id: Number, stop_id: Number, arrival_time: Date, departure_time: Date, stop_sequence: Number });
    map.set("trips", { route_id: Number, trip_id: Number, service_id: Number });

    return map;
}