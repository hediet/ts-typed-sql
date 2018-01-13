import * as sql from "../src";
import {
    update,
    from,
    insertInto,
    values,
    tBoolean,
    val,
    coalesce,
    tInteger,
    tText,
    tNumeric,
    fromItemTypes,
    tStringEnum,
    table,
    Type,
    tJson,
    Expression,
    IntegerType,
    KnownFunctionInvocation,
    FromItemToOutRow
} from "../src";
import { checkResult } from "./testUtil";

class SmallInt extends Type<number, number, "smallint"> {
    public name = "smallint";

    serialize(arg: number): string | number | boolean {
        return arg;
    }

    deserialize(arg: string | number | boolean): number {
        return +arg;
    }
}

// fake integer brand to allow .plus, .minus etc until hediet fixes his lib
class BigInt extends Type<number, number, "integer"> {
    public readonly _brand: "integer";
    public name = "bigint";

    serialize(arg: number): string | number | boolean {
        return arg;
    }

    deserialize(arg: string | number | boolean): number {
        return +arg;
    }
}

class DoublePrecision extends Type<number, number, "double precision"> {
    public readonly _brand: "double precision";
    public name = "double precision";

    serialize(arg: number): string | number | boolean {
        return arg;
    }

    deserialize(arg: string | number | boolean): number {
        return +arg;
    }
}

function floor(arg: Expression<IntegerType>) {
    return new KnownFunctionInvocation("floor", [arg], tInteger);
}

const now = () => new KnownFunctionInvocation("now", [], timestamptz);
const smallint = new SmallInt();
const doublePrecision = new DoublePrecision();
// todo, fix these to work independent of parser set for bigints (which changes based on server type)
// right now assume all these return text even though they return number on some of the servers
const bigint = new BigInt();
const numeric = tText;
const uuid = tText;
const real = tText;
class TimestampType extends Type<Date, Date, "timestamptz"> {
    name = "timestamptz";
    serialize(arg: Date): string | number | boolean {
        return arg as any;
    }

    deserialize(arg: string | number | boolean): Date {
        return new Date("" + arg);
    }
}
const timestamptz = new TimestampType();
class IntervalType extends Type<string, string, "interval"> {
    name = "interval";
    serialize(arg: string): string | number | boolean {
        return arg as any;
    }

    deserialize(arg: string | number | boolean): string {
        return "" + arg;
    }
}
const interval = new IntervalType();
namespace pub {
    export const users = table(
        { schema: "public", name: "users" },
        {
            username: tText
        },
        {
            id: bigint,
            created: timestamptz,
            gitid: numeric,
            transfermodel: tText.orNull(),
            uscent_balance: bigint,
            token_abssum: bigint,
            total_delta: bigint,
            total_delta_offset: bigint,
            refer_id: tText.orNull(),
            trust_acceleration: tBoolean,
            image: tText.orNull(),
            muted_until: timestamptz.orNull(),
            gitlab_userid: tText.orNull(),
            tokens_added: bigint,
            action_total_count: tInteger,
            outgoing_disabled: tBoolean,
            privacy_hardening: tBoolean,
            total_referees: tInteger,
            change_count: bigint,
            user_type: tStringEnum<"normal" | "admininstrator">(),
            trust_points: bigint,
            partner_percentage: smallint,
            partner_token_posdelta: bigint,
            referrer_id: bigint.orNull(),
            referred_date: timestamptz.orNull(),
            verified: tBoolean,
            previous_action: timestamptz.orNull()
        }
    );
    export interface User extends sql.FromItemToOutRow<typeof users> {}

    export const transfers = table(
        { schema: "public", name: "transfers" },
        {
            id: uuid,
            from_user_id: users.id.type,
            to_user_id: users.id.type,
            amount: bigint
        },
        {
            created: timestamptz
        }
    );

    export const games = table(
        { schema: "public", name: "games" },
        {
            engine_id: tInteger,
            game_unsong: bigint,
            ended: tBoolean,
            multiplier: real.orNull(),
            bonus_pool: bigint.orNull()
        },
        {
            id: bigint,
            created: timestamptz,
            bonus_won: tBoolean
        }
    );

    export const plays = table(
        { schema: "public", name: "plays" },
        {
            user_id: users.id.type,
            stopped: bigint.orNull(),
            auto_stopped: bigint,
            game_id: games.id.type,
            engine_id: tInteger,
            number: bigint,
            trust_points: bigint.orNull(),
            bonus: bigint.orNull()
        },
        {
            id: bigint,
            created: timestamptz
        }
    );

    export const tokendistributions = table(
        { schema: "public", name: "tokendistributions" },
        {
            base_amount: bigint
        },
        {
            id: tInteger,
            contributed: bigint,
            active: tBoolean,
            open: tBoolean,
            created: timestamptz
        }
    );

    export const messages = table(
        { schema: "public", name: "messages" },
        {
            user_id: users.id.type,
            message: tText,
            is_mover: tBoolean,
            channel: tText
        },
        {
            id: bigint,
            created: timestamptz
        }
    );

    export const retributions = table(
        { schema: "public", name: "retributions" },
        {
            user_id: users.id.type,
            amount: bigint,
            type: tStringEnum<string>().orNull()
        },
        {
            id: bigint,
            time: timestamptz
        }
    );
    export const tokendistribution_contributions = table(
        { schema: "public", name: "tokendistribution_contributions" },
        {
            user_id: users.id.type,
            tokendistribution_id: tokendistributions.id.type,
            amount: bigint
        },
        {
            id: bigint,
            time: timestamptz
        }
    );

    export const tokendistribution_retrievals = table(
        { schema: "public", name: "tokendistribution_retrievals" },
        {
            user_id: users.id.type,
            tokendistribution_id: tokendistributions.id.type,
            amount: bigint.orNull(),
            trust_acceleration: tBoolean
        },
        {
            id: tInteger,
            time_retrieved: timestamptz,
            level: smallint
        }
    );

    export const partner_retrievals = table(
        { schema: "public", name: "partner_retrievals" },
        {
            user_id: users.id.type,
            amount: bigint
        },
        {
            id: bigint,
            time: timestamptz
        }
    );
}

namespace platform {
    export class StringEnumType<T extends string> extends Type<T, T, "string_enum"> {
        constructor(public name: string) {
            super();
        }

        serialize(arg: T): string | number | boolean {
            return arg as string;
        }

        deserialize(arg: string | number | boolean): T {
            return arg as T;
        }
    }

    export function tStringEnum<T extends string>(name: string): StringEnumType<T> {
        return new StringEnumType<T>(name);
    }

    export const item_types = table(
        { schema: "platform", name: "item_types" },
        {
            game: tStringEnum<platformGame>("game"),
            market_hash_name: tText,
            cent_price: tInteger,
            uscents: tNumeric,
            updated: timestamptz,
            update_price_automatically: tBoolean,
            allow_incoming: tBoolean
        },
        {
            id: tInteger,
            requires_outgoing_confirmation: tBoolean
        }
    );

    export const item_subtypes = table(
        { schema: "platform", name: "item_subtypes" },
        {
            class_id: item_types.id.type,
            image: tText,
            special: tText.orNull(),
            cent_price: tInteger.orNull(),
            platform_classid: tText,
            allow_incoming: tBoolean
        },
        { id: tInteger }
    );

    export const movers = table(
        { schema: "platform", name: "movers" },
        {
            gitid: tText,
            username: tText,
            active: tBoolean
        },
        {
            id: tInteger,
            incoming_enabled: tBoolean,
            outgoing_enabled: tBoolean,
            state_text: tText.orNull()
        }
    );
    export type MoverInfo = FromItemToOutRow<typeof movers>;

    export const special_prices = table(
        { schema: "platform", name: "special_prices" },
        {
            class_id: item_types.id.type,
            special: tText,
            cent_price: tInteger
        },
        { id: tInteger }
    );

    export const mover_inventories = table(
        { schema: "platform", name: "mover_inventories" },
        {
            entryid: tText,
            subtype_id: item_subtypes.id.type,
            owning_mover_id: tInteger,
            sent_in_transfer: tText.orNull()
        }
    );

    export interface EntryRef {
        entryid: string;
    }

    export type TheirOurItemsType = { item_id: string; item_subtype_id: number }[];

    export class NumberEnumType<T extends number> extends Type<T, T, "string_enum"> {
        constructor(public name: string) {
            super();
        }

        serialize(arg: T): string | number | boolean {
            return arg as number;
        }

        deserialize(arg: string | number | boolean): T {
            return arg as T;
        }
    }

    export function tNumberEnum<T extends number>(name: string): NumberEnumType<T> {
        return new NumberEnumType<T>(name);
    }

    export namespace transferState {
        export const unsent = "unsent";
        export const confirming = "confirming";
        export const sent = "sent";
        /** this only happens when transfer is in escrow and can actually transform to accepted. TODO: rename to "inEscrow" */
        export const aborting = "aborting";
        export const accepted = "accepted";
        export const aborted = "aborted";
        export const reserved = "reserved";
        export const $all: transferState[] = [
            unsent,
            confirming,
            sent,
            aborting,
            accepted,
            aborted,
            reserved
        ];
    }
    export type transferState =
        | typeof transferState.unsent
        | typeof transferState.confirming
        | typeof transferState.sent
        | typeof transferState.aborting
        | typeof transferState.accepted
        | typeof transferState.aborted
        | typeof transferState.reserved;

    export namespace transferType {
        export const outgoing = "outgoing",
            incoming = "incoming",
            internal = "internal";
        export const $all: transferType[] = [outgoing, incoming, internal];
    }
    export type transferType =
        | typeof transferType.outgoing
        | typeof transferType.incoming
        | typeof transferType.internal;

    export const transfers = table(
        { schema: "platform", name: "transfers" },
        {
            platform_transfer_offer_id: tText.orNull(),
            our_items: tJson<TheirOurItemsType>(),
            our_gitid: tText,
            their_items: tJson<TheirOurItemsType>(),
            their_gitid: tText,
            transfer_type: tStringEnum<transferType>("platform.transfer_type"),
            state: tStringEnum<transferState>("platform.transfer_state"),
            state_message: tText.orNull(),
            external_state: tNumberEnum<1 | 2 | 3>("integer").orNull(),
            finished: timestamptz.orNull(),
            finished_flag: tBoolean,
            price: tInteger.orNull(),
            firefly_id: bigint.orNull()
        },
        {
            id: tText,
            created: timestamptz
        }
    );
    export type transfer = FromItemToOutRow<typeof transfers>;
}
type platformGame = "unsong" | "firefly";
namespace firefly {
    const { users } = pub;
    export const codes = table(
        { schema: "firefly", name: "codes" },
        {
            user_id: users.id.type,
            server_code: sql.tText,
            client_code: sql.tText,
            last_nonce: sql.tInteger,
            active: sql.tBoolean
        },
        {
            id: bigint,
            created: timestamptz
        }
    );

    export const firefly = table(
        { schema: "firefly", name: "fireflys" },
        {
            user_id: users.id.type,
            cents: bigint,
            code: codes.id.type,
            won: sql.tBoolean,
            user_token_posdelta: bigint
        },
        {
            id: bigint,
            created: timestamptz
        }
    );
}

const {
    item_types,
    movers,
    item_subtypes,
    transfers,
    mover_inventories,
    special_prices,
    transferState
} = platform;
class DynamicSchema<T extends string> {
    constructor(private schema: string) {}

    games = table(
        { schema: this.schema, name: "games" },
        {
            id: bigint,
            meta_hash: tText,
            state: tStringEnum<"open" | "ongoing" | "completed" | "completing">(),
            bonus_cents: bigint.orNull(),
            bonus_won: tBoolean
        },
        {
            created: timestamptz
        }
    );

    plays = table(
        { schema: this.schema, name: "plays" },
        {
            game_id: this.games.id.type,
            user_id: users.id.type,
            cents: bigint,
            color: tStringEnum<T>(),
            token_posdelta: bigint
        },
        {
            id: bigint,
            created: timestamptz
        }
    );

    bonus_retrievals = table(
        { schema: this.schema, name: "bonus_retrievals" },
        {
            game_id: this.games.id.type,
            user_id: users.id.type,
            type: tStringEnum<"winner" | "peer" | "other">(),
            cents: bigint
        },
        {
            id: bigint,
            created: timestamptz
        }
    );
}

const { users } = pub;

function tuple<T1, T2>(t1: T1, t2: T2): [T1, T2] {
    return [t1, t2];
}
const dateNow = () => new Date("2018-01-01T00:00:00.000Z");

function leaderTests() {
    type Game = "stellar" | "unsong" | "firefly" | "sentry";
    type TimeFrame = "daily" | "weekly" | "allTime";
    const allGames: Game[] = ["stellar", "unsong", "firefly", "sentry"];
    type LeaderType = "token_abssum" | "token_posdelta" | "trust_points";
    function construct(type: LeaderType, date: TimeFrame, games: Game[], expectedResult: any) {
        const stellar = new DynamicSchema("stellar");
        const sentry = new DynamicSchema("sentry");
        type ValuePerGame<T> = { [game in Game]: T };
        type Leader = { id: number; username: string; value: number; count: number };
        type int = sql.Expression<sql.IntegerType>;
        const daily = dateNow(),
            weekly = dateNow();
        daily.setDate(daily.getDate() - 1);
        weekly.setDate(weekly.getDate() - 7);
        const intervals = { daily, weekly, allTime: new Date(0) };

        const dateFilter: ValuePerGame<sql.Column<any, sql.Type<Date, Date, "timestamptz">>> = {
            unsong: pub.plays.created,
            stellar: stellar.plays.created,
            sentry: sentry.plays.created,
            firefly: firefly.firefly.created
        };
        const from: ValuePerGame<
            () => sql.SelectQuery<{}, { user_id: typeof bigint }, sql.NoColumnsSelected>
        > = {
            unsong: () => sql.from(pub.plays),
            stellar: () => sql.from(stellar.plays),
            sentry: () => sql.from(sentry.plays),
            firefly: () => sql.from(firefly.firefly)
        };
        const getters: { [K in LeaderType]: ValuePerGame<int> } = {
            token_abssum: {
                unsong: pub.plays.number,
                stellar: stellar.plays.cents,
                sentry: sentry.plays.cents,
                firefly: firefly.firefly.cents
            },
            token_posdelta: {
                unsong: sql
                    .coalesce(pub.plays.stopped as any, sql.val(0, sql.tInteger))
                    .minus(pub.plays.number)
                    .plus(sql.coalesce(pub.plays.bonus as any, sql.val(0))),
                stellar: stellar.plays.token_posdelta,
                sentry: sentry.plays.token_posdelta,
                firefly: firefly.firefly.user_token_posdelta
            },
            trust_points: {} as any
        };
        const after = intervals[date];
        const [first, ...rest] = games.map(game => {
            const count = getters[type][game].count().as("count");
            const value = getters[type][game].sum().as("value");
            return from[game]()
                .where(dateFilter[game].isAtLeast(after))
                .select("user_id")
                .select(value)
                .select(count)
                .groupBy("user_id")
                .orderBy(value);
        });
        const userFilter = () =>
            pub.users.outgoing_disabled.and(pub.users.user_type.isEqualTo("normal")).not();
        const all = sql.unionAll(first, ...rest).as("all");
        return checkResult({
            query: sql
                .from(all)
                .leftJoin(pub.users)
                .on({ id: all.user_id })
                .where(userFilter())
                .select(all.user_id.as("id"))
                .select(pub.users.username)
                .select(
                    all.value
                        .sum()
                        .cast(sql.tInteger)
                        .as("value")
                )
                .select(
                    all.count
                        .sum()
                        .cast(sql.tInteger)
                        .as("count")
                )
                .orderBy(all.value.sum().desc())
                .groupBy(all.user_id, pub.users.username)
                .limit(123),
            expectedResult
        });
    }
    const gameCombos: Game[][] = [
        ["stellar", "unsong"],
        ["stellar"],
        ["stellar", "unsong", "sentry"],
        ["unsong"],
        allGames
    ];
    const ts = [];
    let inx = 0;
    const expectedLeaderResults = [
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $3) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $4`,
            parameters: ["2017-12-31T00:00:00.000Z", "2017-12-31T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $3) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $4`,
            parameters: ["2017-12-25T00:00:00.000Z", "2017-12-25T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $3) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $4`,
            parameters: ["1970-01-01T00:00:00.000Z", "1970-01-01T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["2017-12-31T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["2017-12-25T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["1970-01-01T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."cents") AS "value", COUNT("sentry"."plays"."cents") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $3 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $4) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $5`,
            parameters: [
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."cents") AS "value", COUNT("sentry"."plays"."cents") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $3 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $4) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $5`,
            parameters: [
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."cents") AS "value", COUNT("sentry"."plays"."cents") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $3 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $4) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $5`,
            parameters: [
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $1 GROUP BY "public"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["2017-12-31T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $1 GROUP BY "public"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["2017-12-25T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $1 GROUP BY "public"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["1970-01-01T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "firefly"."fireflys"."user_id", SUM("firefly"."fireflys"."cents") AS "value", COUNT("firefly"."fireflys"."cents") AS "count" FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."created" >= $3 GROUP BY "firefly"."fireflys"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."cents") AS "value", COUNT("sentry"."plays"."cents") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $4 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $5) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $6`,
            parameters: [
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "firefly"."fireflys"."user_id", SUM("firefly"."fireflys"."cents") AS "value", COUNT("firefly"."fireflys"."cents") AS "count" FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."created" >= $3 GROUP BY "firefly"."fireflys"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."cents") AS "value", COUNT("sentry"."plays"."cents") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $4 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $5) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $6`,
            parameters: [
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."cents") AS "value", COUNT("stellar"."plays"."cents") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM("public"."plays"."number") AS "value", COUNT("public"."plays"."number") AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $2 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "firefly"."fireflys"."user_id", SUM("firefly"."fireflys"."cents") AS "value", COUNT("firefly"."fireflys"."cents") AS "count" FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."created" >= $3 GROUP BY "firefly"."fireflys"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."cents") AS "value", COUNT("sentry"."plays"."cents") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $4 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $5) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $6`,
            parameters: [
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $7) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $8`,
            parameters: [
                "2017-12-31T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "2017-12-31T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $7) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $8`,
            parameters: [
                "2017-12-25T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "2017-12-25T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $7) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $8`,
            parameters: [
                "1970-01-01T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "1970-01-01T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["2017-12-31T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["2017-12-25T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $2) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $3`,
            parameters: ["1970-01-01T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."token_posdelta") AS "value", COUNT("sentry"."plays"."token_posdelta") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $7 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $8) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $9`,
            parameters: [
                "2017-12-31T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."token_posdelta") AS "value", COUNT("sentry"."plays"."token_posdelta") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $7 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $8) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $9`,
            parameters: [
                "2017-12-25T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."token_posdelta") AS "value", COUNT("sentry"."plays"."token_posdelta") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $7 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $8) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $9`,
            parameters: [
                "1970-01-01T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $1) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $2)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $3) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $4)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $5 GROUP BY "public"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $6) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $7`,
            parameters: [0, 0, 0, 0, "2017-12-31T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $1) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $2)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $3) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $4)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $5 GROUP BY "public"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $6) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $7`,
            parameters: [0, 0, 0, 0, "2017-12-25T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $1) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $2)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $3) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $4)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $5 GROUP BY "public"."plays"."user_id" ORDER BY "value") AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $6) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $7`,
            parameters: [0, 0, 0, 0, "1970-01-01T00:00:00.000Z", "normal", 123]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "firefly"."fireflys"."user_id", SUM("firefly"."fireflys"."user_token_posdelta") AS "value", COUNT("firefly"."fireflys"."user_token_posdelta") AS "count" FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."created" >= $7 GROUP BY "firefly"."fireflys"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."token_posdelta") AS "value", COUNT("sentry"."plays"."token_posdelta") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $8 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $9) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $10`,
            parameters: [
                "2017-12-31T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "2017-12-31T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "firefly"."fireflys"."user_id", SUM("firefly"."fireflys"."user_token_posdelta") AS "value", COUNT("firefly"."fireflys"."user_token_posdelta") AS "count" FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."created" >= $7 GROUP BY "firefly"."fireflys"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."token_posdelta") AS "value", COUNT("sentry"."plays"."token_posdelta") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $8 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $9) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $10`,
            parameters: [
                "2017-12-25T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "2017-12-25T00:00:00.000Z",
                "normal",
                123
            ]
        },
        {
            sql: `SELECT "all"."user_id" AS "id", "public"."users"."username", SUM("all"."value")::integer AS "value", SUM("all"."count")::integer AS "count" FROM ((((SELECT "stellar"."plays"."user_id", SUM("stellar"."plays"."token_posdelta") AS "value", COUNT("stellar"."plays"."token_posdelta") AS "count" FROM "stellar"."plays" WHERE "stellar"."plays"."created" >= $1 GROUP BY "stellar"."plays"."user_id" ORDER BY "value") UNION ALL (SELECT "public"."plays"."user_id", SUM(COALESCE("public"."plays"."stopped", $2) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $3)) AS "value", COUNT(COALESCE("public"."plays"."stopped", $4) - "public"."plays"."number" + COALESCE("public"."plays"."bonus", $5)) AS "count" FROM "public"."plays" WHERE "public"."plays"."created" >= $6 GROUP BY "public"."plays"."user_id" ORDER BY "value")) UNION ALL (SELECT "firefly"."fireflys"."user_id", SUM("firefly"."fireflys"."user_token_posdelta") AS "value", COUNT("firefly"."fireflys"."user_token_posdelta") AS "count" FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."created" >= $7 GROUP BY "firefly"."fireflys"."user_id" ORDER BY "value")) UNION ALL (SELECT "sentry"."plays"."user_id", SUM("sentry"."plays"."token_posdelta") AS "value", COUNT("sentry"."plays"."token_posdelta") AS "count" FROM "sentry"."plays" WHERE "sentry"."plays"."created" >= $8 GROUP BY "sentry"."plays"."user_id" ORDER BY "value")) AS "all" LEFT JOIN "public"."users" ON "public"."users"."id" = "all"."user_id" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $9) GROUP BY "all"."user_id", "public"."users"."username" ORDER BY SUM("all"."value") DESC LIMIT $10`,
            parameters: [
                "1970-01-01T00:00:00.000Z",
                0,
                0,
                0,
                0,
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "1970-01-01T00:00:00.000Z",
                "normal",
                123
            ]
        },
        "$leaderResult30$"
    ];
    for (const type of ["token_abssum", "token_posdelta"] as LeaderType[]) {
        for (const games of gameCombos) {
            for (const timeFrame of ["daily", "weekly", "allTime"] as TimeFrame[]) {
                ts.push(() => construct(type, timeFrame, games, expectedLeaderResults[inx++]));
            }
        }
    }
    return ts;
}
const range = { from: new Date(dateNow().valueOf() - 1000 * 60 * 60), to: dateNow() };
export const regressionTests = [
    function() {
        const t = platform;
        return checkResult({
            query: sql
                .from(t.item_types)
                .where({ game: "unsong" })
                .select(t.item_types.$all),
            expectedResult: {
                sql: `SELECT "platform"."item_types".* FROM "platform"."item_types" WHERE "platform"."item_types"."game" = $1`,
                parameters: ["unsong"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(item_types)
                .where({ game: "unsong" })
                .select(item_types.$all),
            expectedResult: {
                sql: `SELECT "platform"."item_types".* FROM "platform"."item_types" WHERE "platform"."item_types"."game" = $1`,
                parameters: ["unsong"]
            }
        });
    },
    function() {
        const updateValues: {
            game: platformGame;
            market_hash_name: string;
            uscents: number;
            allow_incoming: boolean;
        }[] = [
            { game: "unsong", market_hash_name: "someThing", uscents: 123, allow_incoming: false },
            {
                game: "firefly",
                market_hash_name: "someOtherThing",
                uscents: 5000,
                allow_incoming: true
            },
            { game: "unsong", market_hash_name: "greatThing", uscents: 100, allow_incoming: true }
        ];
        const updateTmpTable = values(
            fromItemTypes(item_types, ["game", "market_hash_name", "uscents", "allow_incoming"]),
            updateValues
        ).as("temp");
        const updateQuery = update(item_types)
            .from(updateTmpTable)
            .where({ market_hash_name: item_types.market_hash_name, game: item_types.game })
            .set({
                uscents: updateTmpTable.uscents.cast(tNumeric),
                allow_incoming: updateTmpTable.allow_incoming.cast(tBoolean),
                updated: dateNow()
            });
        return checkResult({
            query: updateQuery,
            expectedResult: {
                sql: `UPDATE "platform"."item_types" SET "uscents" = "temp"."uscents"::numeric, "allow_incoming" = "temp"."allow_incoming"::boolean, "updated" = $1 FROM (VALUES ($2, $3, $4, $5), ($6, $7, $8, $9), ($10, $11, $12, $13)) AS "temp"("game", "market_hash_name", "uscents", "allow_incoming") WHERE "temp"."market_hash_name" = "platform"."item_types"."market_hash_name" AND "temp"."game" = "platform"."item_types"."game"`,
                parameters: [
                    "2018-01-01T00:00:00.000Z",
                    "unsong",
                    "someThing",
                    123,
                    false,
                    "firefly",
                    "someOtherThing",
                    5000,
                    true,
                    "unsong",
                    "greatThing",
                    100,
                    true
                ]
            }
        });
    },
    function() {
        const items = [{ id: 1 }, { id: 2 }, { id: 1 }];
        const itemsByIconId = new Map(items.map(a => tuple(a.id, a)));
        const subtypees = item_subtypes.asNullable();
        const classes = item_types.asNullable();
        const images = values(
            { image_url: tText, game: item_types.game.type, market_hash_name: tText },
            Array.from(itemsByIconId.values()).map(a => ({
                image_url: "foo",
                market_hash_name: "foo",
                game: "unsong" as "unsong"
            }))
        ).as("images");
        return checkResult({
            query: from(images)
                .leftJoin(classes)
                .on({ market_hash_name: images.market_hash_name, game: images.game })
                .leftJoin(subtypees)
                .on({ image: images.image_url, class_id: classes.id })
                .select(images.image_url, images.market_hash_name, images.game)
                .select(subtypees.id.as("subtype_id"), subtypees.class_id.as("subtype_class_id"))
                .select(classes.id.as("class_id")),
            expectedResult: {
                sql: `SELECT "images"."image_url", "images"."market_hash_name", "images"."game", "platform"."item_subtypes"."id" AS "subtype_id", "platform"."item_subtypes"."class_id" AS "subtype_class_id", "platform"."item_types"."id" AS "class_id" FROM (VALUES ($1, $2, $3), ($4, $5, $6)) AS "images"("image_url", "game", "market_hash_name") LEFT JOIN "platform"."item_types" ON "platform"."item_types"."market_hash_name" = "images"."market_hash_name" AND "platform"."item_types"."game" = "images"."game" LEFT JOIN "platform"."item_subtypes" ON "platform"."item_subtypes"."image" = "images"."image_url" AND "platform"."item_subtypes"."class_id" = "platform"."item_types"."id"`,
                parameters: ["foo", "unsong", "foo", "foo", "unsong", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(transfers)
                .where({ id: "foo" })
                .select("transfer_type"),
            expectedResult: {
                sql: `SELECT "platform"."transfers"."transfer_type" FROM "platform"."transfers" WHERE "platform"."transfers"."id" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        const ourItems = [{ entryid: "123" }, { entryid: "456" }];
        return checkResult({
            query: from(mover_inventories)
                .where(mover_inventories.entryid.isIn(ourItems.map(i => i.entryid)))
                .where(mover_inventories.sent_in_transfer.isNotNull())
                .select("entryid"),
            expectedResult: {
                sql: `SELECT "platform"."mover_inventories"."entryid" FROM "platform"."mover_inventories" WHERE ("platform"."mover_inventories"."entryid" IN ($1, $2)) AND "platform"."mover_inventories"."sent_in_transfer" IS NOT NULL`,
                parameters: ["123", "456"]
            }
        });
    },
    function() {
        const ourItems = [{ entryid: "123" }, { entryid: "456" }];
        const theirItems = [1, 2, 3];
        return checkResult({
            query: insertInto(transfers)
                .value({
                    our_gitid: "foo",
                    our_items: ourItems.map(i => ({ item_id: "foo", item_subtype_id: 123 })),
                    their_items: theirItems.map(i => ({
                        item_id: "foo",
                        item_subtype_id: 123
                    })),
                    finished: null,
                    price: null,
                    finished_flag: false,
                    transfer_type: "outgoing",
                    state: "unsent",
                    state_message: null,
                    external_state: null,
                    their_gitid: "foo",
                    platform_transfer_offer_id: null,
                    firefly_id: 123
                })
                .returning("id"),
            expectedResult: {
                sql: `INSERT INTO "platform"."transfers"("our_gitid", "our_items", "their_items", "finished", "price", "finished_flag", "transfer_type", "state", "state_message", "external_state", "their_gitid", "platform_transfer_offer_id", "firefly_id") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING "id"`,
                parameters: [
                    "foo",
                    '[{"item_id":"foo","item_subtype_id":123},{"item_id":"foo","item_subtype_id":123}]',
                    '[{"item_id":"foo","item_subtype_id":123},{"item_id":"foo","item_subtype_id":123},{"item_id":"foo","item_subtype_id":123}]',
                    null,
                    null,
                    false,
                    "outgoing",
                    "unsent",
                    null,
                    null,
                    "foo",
                    null,
                    123
                ]
            }
        });
    },
    function() {
        const ourItems = [{ entryid: "123" }, { entryid: "456" }];
        return checkResult({
            query: update(mover_inventories)
                .set({ sent_in_transfer: "foo" })
                .where(mover_inventories.entryid.isIn(ourItems.map(i => i.entryid))),
            expectedResult: {
                sql: `UPDATE "platform"."mover_inventories" SET "sent_in_transfer" = $1 WHERE "platform"."mover_inventories"."entryid" IN ($2, $3)`,
                parameters: ["foo", "123", "456"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(transfers)
                .where({ id: "foo" })
                .select(transfers.$all),
            expectedResult: {
                sql: `SELECT "platform"."transfers".* FROM "platform"."transfers" WHERE "platform"."transfers"."id" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .set({ platform_transfer_offer_id: "foo" }),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "platform_transfer_offer_id" = $1 WHERE "platform"."transfers"."id" = $2`,
                parameters: ["foo", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo", finished_flag: false })
                .where(transfers.finished.isNull())
                .set({ finished_flag: true, finished: dateNow() })
                .returning("id"),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "finished_flag" = $1, "finished" = $2 WHERE "platform"."transfers"."id" = $3 AND "platform"."transfers"."finished_flag" = $4 AND "platform"."transfers"."finished" IS NULL RETURNING "platform"."transfers"."id"`,
                parameters: [true, "2018-01-01T00:00:00.000Z", "foo", false]
            }
        });
    },
    function() {
        return checkResult({
            query: update(mover_inventories)
                .where({ sent_in_transfer: "foo" })
                .set({ sent_in_transfer: null })
                .returning(
                    mover_inventories.subtype_id.as("itemsubtypeId"),
                    mover_inventories.entryid.as("entryid")
                ),
            expectedResult: {
                sql: `UPDATE "platform"."mover_inventories" SET "sent_in_transfer" = $1 WHERE "platform"."mover_inventories"."sent_in_transfer" = $2 RETURNING "platform"."mover_inventories"."subtype_id" AS "itemsubtypeId", "platform"."mover_inventories"."entryid" AS "entryid"`,
                parameters: [null, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo", finished_flag: false })
                .where(transfers.finished.isNull())
                .set({ finished_flag: true, finished: dateNow() })
                .returning("id"),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "finished_flag" = $1, "finished" = $2 WHERE "platform"."transfers"."id" = $3 AND "platform"."transfers"."finished_flag" = $4 AND "platform"."transfers"."finished" IS NULL RETURNING "platform"."transfers"."id"`,
                parameters: [true, "2018-01-01T00:00:00.000Z", "foo", false]
            }
        });
    },
    function() {
        return checkResult({
            query: from(transfers)
                .where({ id: "foo" })
                .select(
                    "platform_transfer_offer_id",
                    "state",
                    "their_gitid",
                    "finished_flag",
                    "transfer_type"
                ),
            expectedResult: {
                sql: `SELECT "platform"."transfers"."platform_transfer_offer_id", "platform"."transfers"."state", "platform"."transfers"."their_gitid", "platform"."transfers"."finished_flag", "platform"."transfers"."transfer_type" FROM "platform"."transfers" WHERE "platform"."transfers"."id" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .set({ platform_transfer_offer_id: "foo" }),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "platform_transfer_offer_id" = $1 WHERE "platform"."transfers"."id" = $2`,
                parameters: ["foo", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(mover_inventories)
                .where({ owning_mover_id: 123 })
                .leftJoin(item_subtypes)
                .on({ id: mover_inventories.subtype_id })
                .leftJoin(item_types)
                .on({ id: item_subtypes.class_id })
                .select(
                    mover_inventories.entryid.as("entryid"),
                    mover_inventories.subtype_id.as("itemsubtypeId")
                )
                .where(mover_inventories.sent_in_transfer.isNull()),
            expectedResult: {
                sql: `SELECT "platform"."mover_inventories"."entryid" AS "entryid", "platform"."mover_inventories"."subtype_id" AS "itemsubtypeId" FROM "platform"."mover_inventories" LEFT JOIN "platform"."item_subtypes" ON "platform"."item_subtypes"."id" = "platform"."mover_inventories"."subtype_id" LEFT JOIN "platform"."item_types" ON "platform"."item_types"."id" = "platform"."item_subtypes"."class_id" WHERE "platform"."mover_inventories"."owning_mover_id" = $1 AND "platform"."mover_inventories"."sent_in_transfer" IS NULL`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: from(mover_inventories)
                .where({ owning_mover_id: 123 })
                .select(
                    mover_inventories.entryid.as("entryid"),
                    mover_inventories.subtype_id.as("itemsubtypeId")
                ),
            expectedResult: {
                sql: `SELECT "platform"."mover_inventories"."entryid" AS "entryid", "platform"."mover_inventories"."subtype_id" AS "itemsubtypeId" FROM "platform"."mover_inventories" WHERE "platform"."mover_inventories"."owning_mover_id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: update(mover_inventories)
                .where({ entryid: "foo" })
                .set({ subtype_id: 123 }),
            expectedResult: {
                sql: `UPDATE "platform"."mover_inventories" SET "subtype_id" = $1 WHERE "platform"."mover_inventories"."entryid" = $2`,
                parameters: [123, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(movers)
                .where({ active: true })
                .select(movers.$all),
            expectedResult: {
                sql: `SELECT "platform"."movers".* FROM "platform"."movers" WHERE "platform"."movers"."active" = $1`,
                parameters: [true]
            }
        });
    },
    function() {
        return checkResult({
            query: from(movers).select(movers.$all),
            expectedResult: {
                sql: `SELECT "platform"."movers".* FROM "platform"."movers"`,
                parameters: []
            }
        });
    },
    function() {
        return checkResult({
            query: from(movers)
                .select(
                    movers.gitid,
                    movers.id,
                    movers.username,
                    movers.active,
                    movers.incoming_enabled,
                    movers.outgoing_enabled,
                    movers.state_text
                )
                .leftJoin(mover_inventories)
                .on({ owning_mover_id: movers.id })
                .leftJoin(item_subtypes)
                .on({ id: mover_inventories.subtype_id })
                .leftJoin(item_types)
                .on({ id: item_subtypes.class_id })
                .leftJoin(special_prices)
                .on({
                    class_id: item_subtypes.class_id,
                    special: item_subtypes.special.cast(tText)
                })
                .groupBy(movers.id)
                .select(mover_inventories.sent_in_transfer.count().as("pendingItemsCount"))
                .select(
                    mover_inventories.entryid
                        .isNotNull()
                        .and(mover_inventories.sent_in_transfer.isNull())
                        .or(val(null).cast(tBoolean))
                        .count()
                        .as("itemsCount")
                )
                .select(
                    coalesce(
                        item_subtypes.cent_price,
                        special_prices.cent_price,
                        item_types.cent_price
                    )
                        .cast(tInteger, true)
                        .sum()
                        .as("value")
                )
                .select(
                    from(transfers)
                        .where({ our_gitid: movers.gitid })
                        .where(
                            transfers.state
                                .isNotEqualTo(transferState.accepted)
                                .and(transfers.state.isNotEqualTo(transferState.aborted))
                        )
                        .select(transfers.$all.count().as("opentransfersCount"))
                        .asExpression()
                        .as("opentransfersCount")
                )
                .orderBy(movers.id),
            expectedResult: {
                sql: `SELECT "platform"."movers"."gitid", "platform"."movers"."id", "platform"."movers"."username", "platform"."movers"."active", "platform"."movers"."incoming_enabled", "platform"."movers"."outgoing_enabled", "platform"."movers"."state_text", COUNT("platform"."mover_inventories"."sent_in_transfer") AS "pendingItemsCount", COUNT("platform"."mover_inventories"."entryid" IS NOT NULL AND "platform"."mover_inventories"."sent_in_transfer" IS NULL OR $1::boolean) AS "itemsCount", SUM(COALESCE("platform"."item_subtypes"."cent_price", "platform"."special_prices"."cent_price", "platform"."item_types"."cent_price")) AS "value", (SELECT COUNT("platform"."transfers".*) AS "opentransfersCount" FROM "platform"."transfers" WHERE "platform"."transfers"."our_gitid" = "platform"."movers"."gitid" AND "platform"."transfers"."state" != $2 AND "platform"."transfers"."state" != $3) AS "opentransfersCount" FROM "platform"."movers" LEFT JOIN "platform"."mover_inventories" ON "platform"."mover_inventories"."owning_mover_id" = "platform"."movers"."id" LEFT JOIN "platform"."item_subtypes" ON "platform"."item_subtypes"."id" = "platform"."mover_inventories"."subtype_id" LEFT JOIN "platform"."item_types" ON "platform"."item_types"."id" = "platform"."item_subtypes"."class_id" LEFT JOIN "platform"."special_prices" ON "platform"."special_prices"."class_id" = "platform"."item_subtypes"."class_id" AND "platform"."special_prices"."special" = "platform"."item_subtypes"."special"::text GROUP BY "platform"."movers"."id" ORDER BY "platform"."movers"."id"`,
                parameters: [null, "accepted", "aborted"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(movers)
                .set({ active: true })
                .where({ id: 123 }),
            expectedResult: {
                sql: `UPDATE "platform"."movers" SET "active" = $1 WHERE "platform"."movers"."id" = $2`,
                parameters: [true, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: update(movers)
                .set({ active: false })
                .where({ id: 123 }),
            expectedResult: {
                sql: `UPDATE "platform"."movers" SET "active" = $1 WHERE "platform"."movers"."id" = $2`,
                parameters: [false, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: from(users)
                .where({ id: 123 })
                .select("gitid"),
            expectedResult: {
                sql: `SELECT "public"."users"."gitid" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        let query = from(transfers)
            .select(transfers.id.as("transferId"))
            .orderBy(transfers.created.desc());
        return checkResult({
            query: query,
            expectedResult: {
                sql: `SELECT "platform"."transfers"."id" AS "transferId" FROM "platform"."transfers" ORDER BY "platform"."transfers"."created" DESC`,
                parameters: []
            }
        });
    },
    function() {
        return checkResult({
            query: from(transfers)
                .where({ id: "foo" })
                .select("transfer_type", "price", "their_gitid", "their_items"),
            expectedResult: {
                sql: `SELECT "platform"."transfers"."transfer_type", "platform"."transfers"."price", "platform"."transfers"."their_gitid", "platform"."transfers"."their_items" FROM "platform"."transfers" WHERE "platform"."transfers"."id" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        let query = update(users)
            .where({ gitid: "foo" })
            .set({ uscent_balance: users.uscent_balance.plus(123) })
            .returning("uscent_balance", "tokens_added", "referrer_id", "id");
        return checkResult({
            query: query,
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1 WHERE "public"."users"."gitid" = $2 RETURNING "public"."users"."uscent_balance", "public"."users"."tokens_added", "public"."users"."referrer_id", "public"."users"."id"`,
                parameters: [123, "foo"]
            }
        });
    },
    function() {
        const activeMoverIds = [1, 2, 3];
        return checkResult({
            query: from(mover_inventories)
                .where(
                    mover_inventories.sent_in_transfer.isNull(),
                    mover_inventories.owning_mover_id.isIn(activeMoverIds)
                )
                .select(
                    mover_inventories.subtype_id.as("itemsubtypeId"),
                    mover_inventories.entryid.as("entryid")
                ),
            expectedResult: {
                sql: `SELECT "platform"."mover_inventories"."subtype_id" AS "itemsubtypeId", "platform"."mover_inventories"."entryid" AS "entryid" FROM "platform"."mover_inventories" WHERE "platform"."mover_inventories"."sent_in_transfer" IS NULL AND ("platform"."mover_inventories"."owning_mover_id" IN ($1, $2, $3))`,
                parameters: [1, 2, 3]
            }
        });
    },
    function() {
        const entryids = ["1", "2", "3"];
        return checkResult({
            query: from(mover_inventories)
                .leftJoin(item_subtypes)
                .on({ id: mover_inventories.subtype_id })
                .leftJoin(item_types)
                .on({ id: item_subtypes.class_id })
                .leftJoin(special_prices)
                .on({
                    class_id: item_subtypes.class_id,
                    special: item_subtypes.special.cast(tText)
                })
                .where(mover_inventories.entryid.isIn(entryids))
                .where(mover_inventories.sent_in_transfer.isNull())
                .orderBy("owning_mover_id")
                .select(
                    mover_inventories.owning_mover_id,
                    mover_inventories.entryid.as("entryid"),
                    item_types.market_hash_name,
                    item_subtypes.id.as("subtypeId"),
                    coalesce(
                        item_subtypes.cent_price,
                        special_prices.cent_price,
                        item_types.cent_price
                    ).as("centPrice")
                ),
            expectedResult: {
                sql: `SELECT "platform"."mover_inventories"."owning_mover_id", "platform"."mover_inventories"."entryid" AS "entryid", "platform"."item_types"."market_hash_name", "platform"."item_subtypes"."id" AS "subtypeId", COALESCE("platform"."item_subtypes"."cent_price", "platform"."special_prices"."cent_price", "platform"."item_types"."cent_price") AS "centPrice" FROM "platform"."mover_inventories" LEFT JOIN "platform"."item_subtypes" ON "platform"."item_subtypes"."id" = "platform"."mover_inventories"."subtype_id" LEFT JOIN "platform"."item_types" ON "platform"."item_types"."id" = "platform"."item_subtypes"."class_id" LEFT JOIN "platform"."special_prices" ON "platform"."special_prices"."class_id" = "platform"."item_subtypes"."class_id" AND "platform"."special_prices"."special" = "platform"."item_subtypes"."special"::text WHERE ("platform"."mover_inventories"."entryid" IN ($1, $2, $3)) AND "platform"."mover_inventories"."sent_in_transfer" IS NULL ORDER BY "platform"."mover_inventories"."owning_mover_id"`,
                parameters: ["1", "2", "3"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(users)
                .where({ gitid: "foo" })
                .select("uscent_balance", "trust_points", "trust_acceleration"),
            expectedResult: {
                sql: `SELECT "public"."users"."uscent_balance", "public"."users"."trust_points", "public"."users"."trust_acceleration" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .set({ price: 123 }),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "price" = $1 WHERE "platform"."transfers"."id" = $2`,
                parameters: [123, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(users)
                .select("tokens_added", "token_abssum", "outgoing_disabled")
                .where({ gitid: "foo" }),
            expectedResult: {
                sql: `SELECT "public"."users"."tokens_added", "public"."users"."token_abssum", "public"."users"."outgoing_disabled" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(users)
                .where({ gitid: "foo" })
                .select("username", "uscent_balance", "trust_points", "trust_acceleration"),
            expectedResult: {
                sql: `SELECT "public"."users"."username", "public"."users"."uscent_balance", "public"."users"."trust_points", "public"."users"."trust_acceleration" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(transfers)
                .where({ their_gitid: "foo" })
                .where(
                    transfers.state
                        .isNotEqualTo(transferState.accepted)
                        .and(transfers.state.isNotEqualTo(transferState.aborted))
                )
                .select(transfers.id, transfers.state),
            expectedResult: {
                sql: `SELECT "platform"."transfers"."id", "platform"."transfers"."state" FROM "platform"."transfers" WHERE "platform"."transfers"."their_gitid" = $1 AND "platform"."transfers"."state" != $2 AND "platform"."transfers"."state" != $3`,
                parameters: ["foo", "accepted", "aborted"]
            }
        });
    },
    function() {
        const InactiveStates: platform.transferState[] = [
            transferState.accepted,
            transferState.aborted
        ];
        return checkResult({
            query: from(transfers)
                .where({ their_gitid: "foo", transfer_type: "incoming" })
                .where(transfers.state.isIn(InactiveStates).not())
                .select("their_items"),
            expectedResult: {
                sql: `SELECT "platform"."transfers"."their_items" FROM "platform"."transfers" WHERE "platform"."transfers"."their_gitid" = $1 AND "platform"."transfers"."transfer_type" = $2 AND NOT ("platform"."transfers"."state" IN ($3, $4))`,
                parameters: ["foo", "incoming", "accepted", "aborted"]
            }
        });
    },
    function() {
        const itemRows = values(
            { item_subtype_id: tInteger, item_id: tText },
            [1, 2, 3, 4].map(x => ({ item_subtype_id: 123, item_id: "foo" }))
        ).as("items");
        return checkResult({
            query: from(itemRows)
                .leftJoin(item_subtypes)
                .on({ id: itemRows.item_subtype_id.cast(tInteger) })
                .leftJoin(item_types)
                .on({ id: item_subtypes.class_id })
                .leftJoin(special_prices)
                .on({
                    class_id: item_subtypes.class_id,
                    special: item_subtypes.special.cast(tText)
                })
                .select(
                    item_types.market_hash_name,
                    coalesce(
                        item_subtypes.cent_price,
                        special_prices.cent_price,
                        item_types.cent_price
                    ).as("centPrice"),
                    item_subtypes.id.as("subtypeId"),
                    item_types.allow_incoming.and(item_subtypes.allow_incoming).as("allow_incoming")
                ),
            expectedResult: {
                sql: `SELECT "platform"."item_types"."market_hash_name", COALESCE("platform"."item_subtypes"."cent_price", "platform"."special_prices"."cent_price", "platform"."item_types"."cent_price") AS "centPrice", "platform"."item_subtypes"."id" AS "subtypeId", "platform"."item_types"."allow_incoming" AND "platform"."item_subtypes"."allow_incoming" AS "allow_incoming" FROM (VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8)) AS "items"("item_subtype_id", "item_id") LEFT JOIN "platform"."item_subtypes" ON "platform"."item_subtypes"."id" = "items"."item_subtype_id"::integer LEFT JOIN "platform"."item_types" ON "platform"."item_types"."id" = "platform"."item_subtypes"."class_id" LEFT JOIN "platform"."special_prices" ON "platform"."special_prices"."class_id" = "platform"."item_subtypes"."class_id" AND "platform"."special_prices"."special" = "platform"."item_subtypes"."special"::text`,
                parameters: [123, "foo", 123, "foo", 123, "foo", 123, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(users)
                .where({ gitid: "foo" })
                .select("uscent_balance", "trust_points", "trust_acceleration"),
            expectedResult: {
                sql: `SELECT "public"."users"."uscent_balance", "public"."users"."trust_points", "public"."users"."trust_acceleration" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .set({ price: 123 }),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "price" = $1 WHERE "platform"."transfers"."id" = $2`,
                parameters: [123, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo", state: "reserved", their_gitid: "foo" })
                .set({ state: "unsent" })
                .returning(transfers.$all),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "state" = $1 WHERE "platform"."transfers"."id" = $2 AND "platform"."transfers"."state" = $3 AND "platform"."transfers"."their_gitid" = $4 RETURNING "platform"."transfers".*`,
                parameters: ["unsent", "foo", "reserved", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .set({
                    state: "aborted",
                    state_message: "foo",
                    external_state: 1
                })
                .returning(transfers.state.as("stateAfter"))
                .returning(
                    from(transfers)
                        .where({ id: "foo" })
                        .select(transfers.state)
                        .asExpression()
                        .as("stateBefore")
                )
                .returning(
                    from(transfers)
                        .where({ id: "foo" })
                        .select(transfers.external_state)
                        .asExpression()
                        .as("platformStateBefore")
                ),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "state" = $1, "state_message" = $2, "external_state" = $3 WHERE "platform"."transfers"."id" = $4 RETURNING "platform"."transfers"."state" AS "stateAfter", (SELECT "platform"."transfers"."state" FROM "platform"."transfers" WHERE "platform"."transfers"."id" = $5) AS "stateBefore", (SELECT "platform"."transfers"."external_state" FROM "platform"."transfers" WHERE "platform"."transfers"."id" = $6) AS "platformStateBefore"`,
                parameters: ["aborted", "foo", 1, "foo", "foo", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(mover_inventories)
                .where({ sent_in_transfer: "foo" })
                .set({ sent_in_transfer: null })
                .returning(
                    mover_inventories.subtype_id.as("itemsubtypeId"),
                    mover_inventories.entryid.as("entryid")
                ),
            expectedResult: {
                sql: `UPDATE "platform"."mover_inventories" SET "sent_in_transfer" = $1 WHERE "platform"."mover_inventories"."sent_in_transfer" = $2 RETURNING "platform"."mover_inventories"."subtype_id" AS "itemsubtypeId", "platform"."mover_inventories"."entryid" AS "entryid"`,
                parameters: [null, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .where(transfers.finished.isNull())
                .set({ finished: dateNow() })
                .returning(transfers.$all),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "finished" = $1 WHERE "platform"."transfers"."id" = $2 AND "platform"."transfers"."finished" IS NULL RETURNING "platform"."transfers".*`,
                parameters: ["2018-01-01T00:00:00.000Z", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: update(transfers)
                .where({ id: "foo" })
                .set({ finished_flag: true }),
            expectedResult: {
                sql: `UPDATE "platform"."transfers" SET "finished_flag" = $1 WHERE "platform"."transfers"."id" = $2`,
                parameters: [true, "foo"]
            }
        });
    },
    function() {
        const theTimeFiveMinsAgo = dateNow(),
            theTimeTwoMinsAgo = dateNow();
        return checkResult({
            query: from(transfers)
                .where({ state: "sent" })
                .where(transfers.created.isLessThan(theTimeFiveMinsAgo))
                .select(transfers.$all),
            expectedResult: {
                sql: `SELECT "platform"."transfers".* FROM "platform"."transfers" WHERE "platform"."transfers"."state" = $1 AND "platform"."transfers"."created" < $2`,
                parameters: ["sent", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const theTimeFiveMinsAgo = dateNow(),
            theTimeTwoMinsAgo = dateNow();
        theTimeTwoMinsAgo.setMinutes(theTimeTwoMinsAgo.getMinutes() - 2);
        theTimeFiveMinsAgo.setMinutes(theTimeFiveMinsAgo.getMinutes() - 5);
        return checkResult({
            query: from(transfers)
                .where(transfers.created.isLessThan(theTimeTwoMinsAgo))
                .where(transfers.created.isGreaterThan(theTimeFiveMinsAgo))
                .where({ state: "accepted" })
                .select(
                    transfers.$all
                        .count()
                        .isGreaterThan(0)
                        .as("worked")
                ),
            expectedResult: {
                sql: `SELECT COUNT("platform"."transfers".*) > $1 AS "worked" FROM "platform"."transfers" WHERE "platform"."transfers"."created" < $2 AND "platform"."transfers"."created" > $3 AND "platform"."transfers"."state" = $4`,
                parameters: [0, "2017-12-31T23:58:00.000Z", "2017-12-31T23:55:00.000Z", "accepted"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(mover_inventories)
                .where(mover_inventories.entryid.isIn(["1", "2"]))
                .select(mover_inventories.entryid.as("entryid"))
                .select(mover_inventories.subtype_id.as("itemsubtypeId")),
            expectedResult: {
                sql: `SELECT "platform"."mover_inventories"."entryid" AS "entryid", "platform"."mover_inventories"."subtype_id" AS "itemsubtypeId" FROM "platform"."mover_inventories" WHERE "platform"."mover_inventories"."entryid" IN ($1, $2)`,
                parameters: ["1", "2"]
            }
        });
    },
    function() {
        return checkResult({
            query: from(item_subtypes)
                .where(item_subtypes.id.isIn([100, 101, 102, 103]))
                .leftJoin(item_types)
                .on({ id: item_subtypes.class_id })
                .leftJoin(special_prices)
                .on({
                    class_id: item_subtypes.class_id,
                    special: item_subtypes.special.cast(tText)
                })
                .select(
                    item_subtypes.id.as("subtypeId"),
                    item_subtypes.platform_classid.as("platform_classid"),
                    item_types.market_hash_name,
                    item_types.game,
                    coalesce(
                        item_subtypes.cent_price,
                        special_prices.cent_price,
                        item_types.cent_price
                    ).as("centPrice")
                )
                .select(
                    item_subtypes.special,
                    item_subtypes.image,
                    item_types.allow_incoming.and(item_subtypes.allow_incoming).as("canincoming")
                ),
            expectedResult: {
                sql: `SELECT "platform"."item_subtypes"."id" AS "subtypeId", "platform"."item_subtypes"."platform_classid" AS "platform_classid", "platform"."item_types"."market_hash_name", "platform"."item_types"."game", COALESCE("platform"."item_subtypes"."cent_price", "platform"."special_prices"."cent_price", "platform"."item_types"."cent_price") AS "centPrice", "platform"."item_subtypes"."special", "platform"."item_subtypes"."image", "platform"."item_types"."allow_incoming" AND "platform"."item_subtypes"."allow_incoming" AS "canincoming" FROM "platform"."item_subtypes" LEFT JOIN "platform"."item_types" ON "platform"."item_types"."id" = "platform"."item_subtypes"."class_id" LEFT JOIN "platform"."special_prices" ON "platform"."special_prices"."class_id" = "platform"."item_subtypes"."class_id" AND "platform"."special_prices"."special" = "platform"."item_subtypes"."special"::text WHERE "platform"."item_subtypes"."id" IN ($1, $2, $3, $4)`,
                parameters: [100, 101, 102, 103]
            }
        });
    },
    function() {
        return checkResult({
            query: from(transfers)
                .where(transfers.id.isIn(["1"]))
                .leftJoin(movers)
                .on({ gitid: transfers.our_gitid })
                .select(transfers.$all)
                .select(movers.id.as("moverId")),
            expectedResult: {
                sql: `SELECT "platform"."transfers".*, "platform"."movers"."id" AS "moverId" FROM "platform"."transfers" LEFT JOIN "platform"."movers" ON "platform"."movers"."gitid" = "platform"."transfers"."our_gitid" WHERE "platform"."transfers"."id" IN ($1)`,
                parameters: ["1"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ gitid: "foo" })
                .set({ verified: true }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "verified" = $1 WHERE "public"."users"."gitid" = $2`,
                parameters: [true, "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ gitid: "foo" })
                .set({ transfermodel: "foo" })
                .returning("id"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "transfermodel" = $1 WHERE "public"."users"."gitid" = $2 RETURNING "public"."users"."id"`,
                parameters: ["foo", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select(pub.users.$all)
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users".* FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.users)
                .value({ username: "foo", gitid: "foo", image: "foo" })
                .returning(pub.users.$all),
            expectedResult: {
                sql: `INSERT INTO "public"."users"("username", "gitid", "image") VALUES ($1, $2, $3) RETURNING "public"."users".*`,
                parameters: ["foo", "foo", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql.insertInto(pub.partner_retrievals).value({ user_id: 123, amount: 123 }),
            expectedResult: {
                sql: `INSERT INTO "public"."partner_retrievals"("user_id", "amount") VALUES ($1, $2)`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({
                    uscent_balance: pub.users.uscent_balance.plus(444),
                    referrer_id: 123,
                    referred_date: now()
                }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1, "referrer_id" = $2, "referred_date" = NOW() WHERE "public"."users"."id" = $3`,
                parameters: [444, 123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select("id", "gitid", "username", "image")
                .where({ gitid: "foo" }),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."gitid", "public"."users"."username", "public"."users"."image" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ gitid: "foo" })
                .set({ username: "foo", image: "foo", gitid: "foo" }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "username" = $1, "image" = $2, "gitid" = $3 WHERE "public"."users"."gitid" = $4`,
                parameters: ["foo", "foo", "foo", "foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select("username", "trust_acceleration")
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users"."username", "public"."users"."trust_acceleration" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ username: "foo" }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "username" = $1 WHERE "public"."users"."id" = $2`,
                parameters: ["foo", 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select("image")
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users"."image" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ image: "foo" }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "image" = $1 WHERE "public"."users"."id" = $2`,
                parameters: ["foo", 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .where(pub.users.trust_acceleration.isNotEqualTo(true))
                .set({ trust_acceleration: true }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "trust_acceleration" = $1 WHERE "public"."users"."id" = $2 AND "public"."users"."trust_acceleration" != $3`,
                parameters: [true, 123, true]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select("id")
                .where({ username: "foo" }),
            expectedResult: {
                sql: `SELECT "public"."users"."id" FROM "public"."users" WHERE "public"."users"."username" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ gitid: "foo" })
                .select("id"),
            expectedResult: {
                sql: `SELECT "public"."users"."id" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select(pub.users.$all)
                .where(pub.users.username.toLower().isEqualTo("foo".toLowerCase())),
            expectedResult: {
                sql: `SELECT "public"."users".* FROM "public"."users" WHERE LOWER("public"."users"."username") = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        const p = pub.plays.as("p");
        const u = pub.users.as("u");
        return checkResult({
            query: sql
                .from(u)
                .select("username")
                .from(p)
                .select("number", "stopped", "bonus")
                .where({
                    game_id: 123,
                    engine_id: 123,
                    user_id: u.id
                }),
            expectedResult: {
                sql: `SELECT "u"."username", "p"."number", "p"."stopped", "p"."bonus" FROM "public"."users" AS "u" CROSS JOIN "public"."plays" AS "p" WHERE "p"."game_id" = $1 AND "p"."engine_id" = $2 AND "p"."user_id" = "u"."id"`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        let query = sql
            .from(pub.plays)
            .leftJoin(pub.games)
            .on({ id: pub.plays.game_id })
            .where({ user_id: 123 })
            .where(pub.games.ended)
            .select(
                pub.plays.number,
                pub.plays.bonus,
                pub.plays.stopped,
                pub.plays.created,
                pub.plays.game_id,
                pub.games.game_unsong
            )
            .limit(123);
        return checkResult({
            query: query,
            expectedResult: {
                sql: `SELECT "public"."plays"."number", "public"."plays"."bonus", "public"."plays"."stopped", "public"."plays"."created", "public"."plays"."game_id", "public"."games"."game_unsong" FROM "public"."plays" LEFT JOIN "public"."games" ON "public"."games"."id" = "public"."plays"."game_id" WHERE "public"."plays"."user_id" = $1 AND "public"."games"."ended" LIMIT $2`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        const defaultToZero = (expr: sql.Expression<any>) => sql.coalesce(expr, sql.val(0));
        const p = pub.plays;
        const after = new Date(1505849924497);
        return checkResult({
            query: sql
                .from(p)
                .select(
                    defaultToZero(p.stopped)
                        .sum()
                        .plus(defaultToZero(p.bonus).sum())
                        .minus(defaultToZero(p.number.sum()))
                        .cast(sql.tText, true)
                        .as("token_posdelta"),
                    p.$all.count().as("count")
                )
                .where({ user_id: 123 })
                .where(p.created.isGreaterThan(after)),
            expectedResult: {
                sql: `SELECT SUM(COALESCE("public"."plays"."stopped", $1)) + SUM(COALESCE("public"."plays"."bonus", $2)) - COALESCE(SUM("public"."plays"."number"), $3) AS "token_posdelta", COUNT("public"."plays".*) AS "count" FROM "public"."plays" WHERE "public"."plays"."user_id" = $4 AND "public"."plays"."created" > $5`,
                parameters: [0, 0, 0, 123, "2017-09-19T19:38:44.497Z"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select(
                    "id",
                    "username",
                    "gitid",
                    "image",
                    "token_abssum",
                    "change_count",
                    "privacy_hardening"
                )
                .select(pub.users.total_delta.minus(pub.users.total_delta_offset).as("total_delta"))
                .where({ username: "foo" }),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."username", "public"."users"."gitid", "public"."users"."image", "public"."users"."token_abssum", "public"."users"."change_count", "public"."users"."privacy_hardening", "public"."users"."total_delta" - "public"."users"."total_delta_offset" AS "total_delta" FROM "public"."users" WHERE "public"."users"."username" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select(
                    "verified",
                    "token_abssum",
                    "outgoing_disabled",
                    "tokens_added",
                    "user_type"
                )
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users"."verified", "public"."users"."token_abssum", "public"."users"."outgoing_disabled", "public"."users"."tokens_added", "public"."users"."user_type" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select("verified")
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users"."verified" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({
                    uscent_balance: pub.users.uscent_balance.minus(123)
                })
                .returning("uscent_balance"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" - $1 WHERE "public"."users"."id" = $2 RETURNING "public"."users"."uscent_balance"`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({
                    uscent_balance: pub.users.uscent_balance.plus(123)
                })
                .returning("username", "uscent_balance"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1 WHERE "public"."users"."id" = $2 RETURNING "public"."users"."username", "public"."users"."uscent_balance"`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.transfers)
                .value({ id: "foo", from_user_id: 123, to_user_id: 123, amount: 123 })
                .returning("id"),
            expectedResult: {
                sql: `INSERT INTO "public"."transfers"("id", "from_user_id", "to_user_id", "amount") VALUES ($1, $2, $3, $4) RETURNING "id"`,
                parameters: ["foo", 123, 123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select(pub.users.$all)
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users".* FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        const mutedUntil = dateNow();
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ muted_until: mutedUntil }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "muted_until" = $1 WHERE "public"."users"."id" = $2`,
                parameters: ["2018-01-01T00:00:00.000Z", 123]
            }
        });
    },
    ...leaderTests(),
    function() {
        const leaderboardUserFilter = () =>
            pub.users.outgoing_disabled.and(pub.users.user_type.isEqualTo("normal")).not();
        const allTimeQuery = (column: sql.Column<any, any>) =>
            sql
                .from(pub.users)
                .where(leaderboardUserFilter())
                .select("id", "username")
                .select(column.as("value"))
                .select(pub.users.change_count.as("count"))
                .orderBy(column.desc())
                .limit(123);
        return checkResult({
            query: allTimeQuery(pub.users.token_abssum),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."username", "public"."users"."token_abssum" AS "value", "public"."users"."change_count" AS "count" FROM "public"."users" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $1) ORDER BY "public"."users"."token_abssum" DESC LIMIT $2`,
                parameters: ["normal", 123]
            }
        });
    },
    function() {
        const leaderboardUserFilter = () =>
            pub.users.outgoing_disabled.and(pub.users.user_type.isEqualTo("normal")).not();
        const allTimeQuery = (column: sql.Column<any, any>) =>
            sql
                .from(pub.users)
                .where(leaderboardUserFilter())
                .select("id", "username")
                .select(column.as("value"))
                .select(pub.users.change_count.as("count"))
                .orderBy(column.desc())
                .limit(123);
        return checkResult({
            query: allTimeQuery(pub.users.total_delta),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."username", "public"."users"."total_delta" AS "value", "public"."users"."change_count" AS "count" FROM "public"."users" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $1) ORDER BY "public"."users"."total_delta" DESC LIMIT $2`,
                parameters: ["normal", 123]
            }
        });
    },
    function() {
        const leaderboardUserFilter = () =>
            pub.users.outgoing_disabled.and(pub.users.user_type.isEqualTo("normal")).not();
        const allTimeQuery = (column: sql.Column<any, any>) =>
            sql
                .from(pub.users)
                .where(leaderboardUserFilter())
                .select("id", "username")
                .select(column.as("value"))
                .select(pub.users.change_count.as("count"))
                .orderBy(column.desc())
                .limit(123);
        return checkResult({
            query: allTimeQuery(pub.users.trust_points),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."username", "public"."users"."trust_points" AS "value", "public"."users"."change_count" AS "count" FROM "public"."users" WHERE NOT ("public"."users"."outgoing_disabled" AND "public"."users"."user_type" = $1) ORDER BY "public"."users"."trust_points" DESC LIMIT $2`,
                parameters: ["normal", 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.messages)
                .value({
                    user_id: 123,
                    created: dateNow(),
                    message: "foo",
                    channel: "foo",
                    is_mover: true
                })
                .returning("id"),
            expectedResult: {
                sql: `INSERT INTO "public"."messages"("user_id", "created", "message", "channel", "is_mover") VALUES ($1, $2, $3, $4, $5) RETURNING "id"`,
                parameters: [123, "2018-01-01T00:00:00.000Z", "foo", "foo", true]
            }
        });
    },
    function() {
        const u = pub.users.as("u");
        const c = pub.messages.as("c");
        return checkResult({
            query: sql
                .from(c)
                .select(
                    c.created.as("date"),
                    sql
                        .val("say")
                        .cast(sql.tText)
                        .as("type"),
                    c.user_id,
                    c.message,
                    c.is_mover.as("mover")
                )
                .select(u.username, u.trust_points, u.user_type.as("role"), u.image)
                .leftJoin(u)
                .on({ id: c.user_id })
                .where(
                    sql
                        .and(
                            c.channel.isEqualTo("foo"),
                            u.muted_until.isAtMost(now()).or(u.muted_until.isNull())
                        )
                        .or(c.is_mover)
                )
                .orderBy(c.id.desc())
                .limit(123),
            expectedResult: {
                sql: `SELECT "c"."created" AS "date", $1::text AS "type", "c"."user_id", "c"."message", "c"."is_mover" AS "mover", "u"."username", "u"."trust_points", "u"."user_type" AS "role", "u"."image" FROM "public"."messages" AS "c" LEFT JOIN "public"."users" AS "u" ON "u"."id" = "c"."user_id" WHERE "c"."channel" = $2 AND ("u"."muted_until" <= NOW() OR "u"."muted_until" IS NULL) OR "c"."is_mover" ORDER BY "c"."id" DESC LIMIT $3`,
                parameters: ["say", "foo", 123]
            }
        });
    },
    function() {
        const yesterday = dateNow();
        return checkResult({
            query: sql
                .update(pub.users)
                .set({
                    uscent_balance: pub.users.uscent_balance.plus(123),
                    previous_action: dateNow(),
                    action_total_count: pub.users.action_total_count.plus(1)
                })
                .where({ id: 123 })
                .where(
                    pub.users.previous_action
                        .isNull()
                        .or(pub.users.previous_action.isLessThan(yesterday))
                )
                .returning("uscent_balance"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1, "previous_action" = $2, "action_total_count" = "public"."users"."action_total_count" + $3 WHERE "public"."users"."id" = $4 AND ("public"."users"."previous_action" IS NULL OR "public"."users"."previous_action" < $5) RETURNING "public"."users"."uscent_balance"`,
                parameters: [123, "2018-01-01T00:00:00.000Z", 1, 123, "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.retributions)
                .value({ user_id: 123, amount: 123, type: "daily" }),
            expectedResult: {
                sql: `INSERT INTO "public"."retributions"("user_id", "amount", "type") VALUES ($1, $2, $3)`,
                parameters: [123, 123, "daily"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .set({ uscent_balance: pub.users.uscent_balance.plus(123), gitlab_userid: "foo" })
                .where({ id: 123 })
                .where(pub.users.gitlab_userid.isNull(), pub.users.verified)
                .returning("uscent_balance"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1, "gitlab_userid" = $2 WHERE "public"."users"."id" = $3 AND "public"."users"."gitlab_userid" IS NULL AND "public"."users"."verified" RETURNING "public"."users"."uscent_balance"`,
                parameters: [123, "foo", 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.retributions)
                .value({ user_id: 123, amount: 123, type: "twitter" }),
            expectedResult: {
                sql: `INSERT INTO "public"."retributions"("user_id", "amount", "type") VALUES ($1, $2, $3)`,
                parameters: [123, 123, "twitter"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.tokendistributions)
                .where({ active: true })
                .set({ active: false }),
            expectedResult: {
                sql: `UPDATE "public"."tokendistributions" SET "active" = $1 WHERE "public"."tokendistributions"."active" = $2`,
                parameters: [false, true]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.tokendistributions)
                .select(pub.tokendistributions.$all)
                .where({ active: false, open: true }),
            expectedResult: {
                sql: `SELECT "public"."tokendistributions".* FROM "public"."tokendistributions" WHERE "public"."tokendistributions"."active" = $1 AND "public"."tokendistributions"."open" = $2`,
                parameters: [false, true]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.tokendistributions)
                .value({ base_amount: 123 })
                .returning("id"),
            expectedResult: {
                sql: `INSERT INTO "public"."tokendistributions"("base_amount") VALUES ($1) RETURNING "id"`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql.deleteFrom(pub.tokendistributions).where({ active: false, open: true }),
            expectedResult: {
                sql: `DELETE FROM "public"."tokendistributions" WHERE "public"."tokendistributions"."active" = $1 AND "public"."tokendistributions"."open" = $2`,
                parameters: [false, true]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.tokendistributions)
                .where({ id: 123 })
                .set({ active: true, open: false }),
            expectedResult: {
                sql: `UPDATE "public"."tokendistributions" SET "active" = $1, "open" = $2 WHERE "public"."tokendistributions"."id" = $3`,
                parameters: [true, false, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.tokendistributions)
                .where({ id: 123 })
                .set({ active: false, open: false }),
            expectedResult: {
                sql: `UPDATE "public"."tokendistributions" SET "active" = $1, "open" = $2 WHERE "public"."tokendistributions"."id" = $3`,
                parameters: [false, false, 123]
            }
        });
    },
    function() {
        const after = dateNow();
        return checkResult({
            query: sql
                .from(platform.transfers)
                .where({ their_gitid: "foo", transfer_type: "incoming", state: "accepted" })
                .where(platform.transfers.created.isAtLeast(after))
                .select(
                    platform.transfers.price
                        .cast(sql.tInteger, true)
                        .sum()
                        .as("sum")
                ),
            expectedResult: {
                sql: `SELECT SUM("platform"."transfers"."price") AS "sum" FROM "platform"."transfers" WHERE "platform"."transfers"."their_gitid" = $1 AND "platform"."transfers"."transfer_type" = $2 AND "platform"."transfers"."state" = $3 AND "platform"."transfers"."created" >= $4`,
                parameters: ["foo", "incoming", "accepted", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.tokendistributions)
                .select(pub.tokendistributions.$all)
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."tokendistributions".* FROM "public"."tokendistributions" WHERE "public"."tokendistributions"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.tokendistribution_retrievals)
                .select(pub.tokendistribution_retrievals.$all)
                .where({ user_id: 123, tokendistribution_id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."tokendistribution_retrievals".* FROM "public"."tokendistribution_retrievals" WHERE "public"."tokendistribution_retrievals"."user_id" = $1 AND "public"."tokendistribution_retrievals"."tokendistribution_id" = $2`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.tokendistribution_retrievals)
                .value({
                    user_id: 123,
                    tokendistribution_id: 123,
                    trust_acceleration: true,
                    level: 123,
                    amount: null
                }),
            expectedResult: {
                sql: `INSERT INTO "public"."tokendistribution_retrievals"("user_id", "tokendistribution_id", "trust_acceleration", "level", "amount") VALUES ($1, $2, $3, $4, $5)`,
                parameters: [123, 123, true, 123, null]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.tokendistributions)
                .select(pub.tokendistributions.$all.count().as("tokendistributions"))
                .where({ open: true }),
            expectedResult: {
                sql: `SELECT COUNT("public"."tokendistributions".*) AS "tokendistributions" FROM "public"."tokendistributions" WHERE "public"."tokendistributions"."open" = $1`,
                parameters: [true]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ id: 123 })
                .select("uscent_balance", "outgoing_disabled"),
            expectedResult: {
                sql: `SELECT "public"."users"."uscent_balance", "public"."users"."outgoing_disabled" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ uscent_balance: pub.users.uscent_balance.minus(123) })
                .returning("uscent_balance", "username"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" - $1 WHERE "public"."users"."id" = $2 RETURNING "public"."users"."uscent_balance", "public"."users"."username"`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.tokendistributions)
                .set({ contributed: pub.tokendistributions.contributed.plus(123) })
                .where({ active: false, open: true })
                .returning("id", "base_amount", "contributed"),
            expectedResult: {
                sql: `UPDATE "public"."tokendistributions" SET "contributed" = "public"."tokendistributions"."contributed" + $1 WHERE "public"."tokendistributions"."active" = $2 AND "public"."tokendistributions"."open" = $3 RETURNING "public"."tokendistributions"."id", "public"."tokendistributions"."base_amount", "public"."tokendistributions"."contributed"`,
                parameters: [123, false, true]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .insertInto(pub.tokendistribution_contributions)
                .value({ user_id: 123, tokendistribution_id: 123, amount: 123 }),
            expectedResult: {
                sql: `INSERT INTO "public"."tokendistribution_contributions"("user_id", "tokendistribution_id", "amount") VALUES ($1, $2, $3)`,
                parameters: [123, 123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.tokendistributions)
                .where({ id: 123 })
                .select(pub.tokendistributions.$all),
            expectedResult: {
                sql: `SELECT "public"."tokendistributions".* FROM "public"."tokendistributions" WHERE "public"."tokendistributions"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.tokendistribution_retrievals)
                .where({ tokendistribution_id: 123 })
                .select(pub.tokendistribution_retrievals.$all),
            expectedResult: {
                sql: `SELECT "public"."tokendistribution_retrievals".* FROM "public"."tokendistribution_retrievals" WHERE "public"."tokendistribution_retrievals"."tokendistribution_id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.tokendistribution_retrievals)
                .where({ id: 123 })
                .set({ amount: 123 }),
            expectedResult: {
                sql: `UPDATE "public"."tokendistribution_retrievals" SET "amount" = $1 WHERE "public"."tokendistribution_retrievals"."id" = $2`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ uscent_balance: pub.users.uscent_balance.plus(123) })
                .returning("uscent_balance"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1 WHERE "public"."users"."id" = $2 RETURNING "public"."users"."uscent_balance"`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ refer_id: "foo" })
                .select(pub.users.$all),
            expectedResult: {
                sql: `SELECT "public"."users".* FROM "public"."users" WHERE "public"."users"."refer_id" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .set({
                    referrer_id: 123,
                    referred_date: dateNow(),
                    partner_token_posdelta: pub.users.partner_token_posdelta.plus(1337)
                })
                .where({ id: 123 })
                .where(pub.users.referrer_id.isNull())
                .returning(pub.users.tokens_added),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "referrer_id" = $1, "referred_date" = $2, "partner_token_posdelta" = "public"."users"."partner_token_posdelta" + $3 WHERE "public"."users"."id" = $4 AND "public"."users"."referrer_id" IS NULL RETURNING "public"."users"."tokens_added"`,
                parameters: [123, "2018-01-01T00:00:00.000Z", 1337, 123]
            }
        });
    },
    function() {
        const cents = floor(pub.users.partner_token_posdelta.div(123));
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .where(cents.isNotEqualTo(0))
                .set({
                    partner_token_posdelta: pub.users.partner_token_posdelta.minus(cents.mult(123)),
                    uscent_balance: pub.users.uscent_balance.plus(cents)
                })
                .returning(
                    // returning needs subquery to fetch old value
                    sql
                        .from(pub.users)
                        .where({ id: 123 })
                        .select(cents.as("cents"))
                        .asExpression()
                        .as("cent_amount")
                ),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "partner_token_posdelta" = "public"."users"."partner_token_posdelta" - FLOOR("public"."users"."partner_token_posdelta" / $1) * $2, "uscent_balance" = "public"."users"."uscent_balance" + FLOOR("public"."users"."partner_token_posdelta" / $3) WHERE "public"."users"."id" = $4 AND FLOOR("public"."users"."partner_token_posdelta" / $5) != $6 RETURNING (SELECT FLOOR("public"."users"."partner_token_posdelta" / $7) AS "cents" FROM "public"."users" WHERE "public"."users"."id" = $8) AS "cent_amount"`,
                parameters: [123, 123, 123, 123, 123, 0, 123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql.insertInto(pub.partner_retrievals).value({ user_id: 123, amount: 123 }),
            expectedResult: {
                sql: `INSERT INTO "public"."partner_retrievals"("user_id", "amount") VALUES ($1, $2)`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({
                    partner_token_posdelta: pub.users.partner_token_posdelta.plus(
                        pub.users.partner_percentage
                            .cast(sql.tInteger, false)
                            .mult(100)
                            .div(100)
                    )
                }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "partner_token_posdelta" = "public"."users"."partner_token_posdelta" + "public"."users"."partner_percentage"::integer * $1 / $2 WHERE "public"."users"."id" = $3`,
                parameters: [100, 100, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ total_referees: pub.users.total_referees.plus(1) })
                .set({
                    partner_token_posdelta: pub.users.partner_token_posdelta.plus(5)
                })
                .returning("total_referees", "partner_percentage"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "total_referees" = "public"."users"."total_referees" + $1, "partner_token_posdelta" = "public"."users"."partner_token_posdelta" + $2 WHERE "public"."users"."id" = $3 RETURNING "public"."users"."total_referees", "public"."users"."partner_percentage"`,
                parameters: [1, 5, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ partner_percentage: 123 }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "partner_percentage" = $1 WHERE "public"."users"."id" = $2`,
                parameters: [123, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .select("username")
                .where({ id: 123 }),
            expectedResult: {
                sql: `SELECT "public"."users"."username" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ total_delta_offset: pub.users.total_delta }),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "total_delta_offset" = "public"."users"."total_delta" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({ privacy_hardening: pub.users.privacy_hardening.not() })
                .returning("privacy_hardening"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "privacy_hardening" = NOT "public"."users"."privacy_hardening" WHERE "public"."users"."id" = $1 RETURNING "public"."users"."privacy_hardening"`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.partner_retrievals)
                .where({ user_id: 123 })
                .select(pub.partner_retrievals.amount.sum().as("earnings")),
            expectedResult: {
                sql: `SELECT SUM("public"."partner_retrievals"."amount") AS "earnings" FROM "public"."partner_retrievals" WHERE "public"."partner_retrievals"."user_id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        const referred_date_day = pub.users.referred_date
            .cast(sql.tDate, false)
            .cast(sql.tText, false)
            .as("referred_date_day");
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ referrer_id: 123 })
                .select(referred_date_day)
                .select(pub.users.$all.count().as("total"))
                .select(
                    sql
                        .nullif(pub.users.tokens_added, sql.val(0, bigint))
                        .count()
                        .as("incomingors")
                )
                .orderBy(referred_date_day)
                .groupBy(referred_date_day),
            expectedResult: {
                sql: `SELECT "public"."users"."referred_date"::date::text AS "referred_date_day", COUNT("public"."users".*) AS "total", COUNT(NULLIF("public"."users"."tokens_added", $1)) AS "incomingors" FROM "public"."users" WHERE "public"."users"."referrer_id" = $2 GROUP BY "referred_date_day" ORDER BY "referred_date_day"`,
                parameters: [0, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ id: 123 })
                .select(pub.users.$all),
            expectedResult: {
                sql: `SELECT "public"."users".* FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ id: 123 })
                .select(pub.users.trust_acceleration),
            expectedResult: {
                sql: `SELECT "public"."users"."trust_acceleration" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .update(users)
                .where({ id: 123 })
                .where(users.refer_id.isNull())
                .set({ refer_id: "foo" })
                .returning("refer_id"),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "refer_id" = $1 WHERE "public"."users"."id" = $2 AND "public"."users"."refer_id" IS NULL RETURNING "public"."users"."refer_id"`,
                parameters: ["foo", 123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(users)
                .where(users.username.toLower().isLike(`%${"hi"}%`))
                .select("username", "gitid", "image")
                .limit(20),
            expectedResult: {
                sql: `SELECT "public"."users"."username", "public"."users"."gitid", "public"."users"."image" FROM "public"."users" WHERE LOWER("public"."users"."username") LIKE $1 LIMIT $2`,
                parameters: ["%hi%", 20]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ gitid: "foo" })
                .select(pub.users.id),
            expectedResult: {
                sql: `SELECT "public"."users"."id" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(pub.users)
                .where({ id: 123 })
                .select(pub.users.gitid),
            expectedResult: {
                sql: `SELECT "public"."users"."gitid" FROM "public"."users" WHERE "public"."users"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        const range = { from: new Date(dateNow().valueOf() - 1000 * 60 * 60), to: dateNow() };
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.transfers)
                .where(
                    pub.transfers.from_user_id
                        .isEqualTo(123)
                        .or(pub.transfers.to_user_id.isEqualTo(123))
                )
                .where(filterRange(pub.transfers.created))
                .select(pub.transfers.$all),
            expectedResult: {
                sql: `SELECT "public"."transfers".* FROM "public"."transfers" WHERE ("public"."transfers"."from_user_id" = $1 OR "public"."transfers"."to_user_id" = $2) AND "public"."transfers"."created" >= $3 AND "public"."transfers"."created" <= $4`,
                parameters: [123, 123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const range = { from: new Date(dateNow().valueOf() - 1000 * 60 * 60), to: dateNow() };
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.plays)
                .where({ user_id: 123 })
                .where(filterRange(pub.plays.created))
                .select(pub.plays.$all),
            expectedResult: {
                sql: `SELECT "public"."plays".* FROM "public"."plays" WHERE "public"."plays"."user_id" = $1 AND "public"."plays"."created" >= $2 AND "public"."plays"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const range = { from: new Date(dateNow().valueOf() - 1000 * 60 * 60), to: dateNow() };
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.tokendistribution_contributions)
                .where({ user_id: 123 })
                .where(filterRange(pub.tokendistribution_contributions.time))
                .select(pub.tokendistribution_contributions.$all),
            expectedResult: {
                sql: `SELECT "public"."tokendistribution_contributions".* FROM "public"."tokendistribution_contributions" WHERE "public"."tokendistribution_contributions"."user_id" = $1 AND "public"."tokendistribution_contributions"."time" >= $2 AND "public"."tokendistribution_contributions"."time" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const range = { from: new Date(dateNow().valueOf() - 1000 * 60 * 60), to: dateNow() };
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.messages)
                .where({ user_id: 123 })
                .where(filterRange(pub.messages.created))
                .select(pub.messages.$all),
            expectedResult: {
                sql: `SELECT "public"."messages".* FROM "public"."messages" WHERE "public"."messages"."user_id" = $1 AND "public"."messages"."created" >= $2 AND "public"."messages"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.retributions)
                .where({ user_id: 123 })
                .where(filterRange(pub.retributions.time))
                .select(pub.retributions.$all),
            expectedResult: {
                sql: `SELECT "public"."retributions".* FROM "public"."retributions" WHERE "public"."retributions"."user_id" = $1 AND "public"."retributions"."time" >= $2 AND "public"."retributions"."time" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.tokendistribution_retrievals)
                .where({ user_id: 123 })
                .where(filterRange(pub.tokendistribution_retrievals.time_retrieved))
                .select(pub.tokendistribution_retrievals.$all),
            expectedResult: {
                sql: `SELECT "public"."tokendistribution_retrievals".* FROM "public"."tokendistribution_retrievals" WHERE "public"."tokendistribution_retrievals"."user_id" = $1 AND "public"."tokendistribution_retrievals"."time_retrieved" >= $2 AND "public"."tokendistribution_retrievals"."time_retrieved" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(pub.partner_retrievals)
                .where({ user_id: 123 })
                .where(filterRange(pub.partner_retrievals.time))
                .select(pub.partner_retrievals.$all),
            expectedResult: {
                sql: `SELECT "public"."partner_retrievals".* FROM "public"."partner_retrievals" WHERE "public"."partner_retrievals"."user_id" = $1 AND "public"."partner_retrievals"."time" >= $2 AND "public"."partner_retrievals"."time" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        const stellar = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .from(stellar.plays)
                .where({ user_id: 123 })
                .where(filterRange(stellar.plays.created))
                .select(stellar.plays.$all),
            expectedResult: {
                sql: `SELECT "stellar"."plays".* FROM "stellar"."plays" WHERE "stellar"."plays"."user_id" = $1 AND "stellar"."plays"."created" >= $2 AND "stellar"."plays"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        const stellar = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .from(stellar.bonus_retrievals)
                .where({ user_id: 123 })
                .where(filterRange(stellar.bonus_retrievals.created))
                .select(stellar.bonus_retrievals.$all),
            expectedResult: {
                sql: `SELECT "stellar"."bonus_retrievals".* FROM "stellar"."bonus_retrievals" WHERE "stellar"."bonus_retrievals"."user_id" = $1 AND "stellar"."bonus_retrievals"."created" >= $2 AND "stellar"."bonus_retrievals"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        const sentry = new DynamicSchema("sentry");
        return checkResult({
            query: sql
                .from(sentry.plays)
                .where({ user_id: 123 })
                .where(filterRange(sentry.plays.created))
                .select(sentry.plays.$all),
            expectedResult: {
                sql: `SELECT "sentry"."plays".* FROM "sentry"."plays" WHERE "sentry"."plays"."user_id" = $1 AND "sentry"."plays"."created" >= $2 AND "sentry"."plays"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        const sentry = new DynamicSchema("sentry");
        return checkResult({
            query: sql
                .from(sentry.bonus_retrievals)
                .where({ user_id: 123 })
                .where(filterRange(sentry.bonus_retrievals.created))
                .select(sentry.bonus_retrievals.$all),
            expectedResult: {
                sql: `SELECT "sentry"."bonus_retrievals".* FROM "sentry"."bonus_retrievals" WHERE "sentry"."bonus_retrievals"."user_id" = $1 AND "sentry"."bonus_retrievals"."created" >= $2 AND "sentry"."bonus_retrievals"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(firefly.firefly)
                .where({ user_id: 123 })
                .where(filterRange(firefly.firefly.created))
                .select(firefly.firefly.$all),
            expectedResult: {
                sql: `SELECT "firefly"."fireflys".* FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."user_id" = $1 AND "firefly"."fireflys"."created" >= $2 AND "firefly"."fireflys"."created" <= $3`,
                parameters: [123, "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const filterRange = (t: sql.Column<any, sql.Type<Date, Date, "timestamptz">>) => {
            return t.isAtLeast(new Date(range.from)).and(t.isAtMost(new Date(range.to)));
        };
        return checkResult({
            query: sql
                .from(platform.transfers)
                .where({ their_gitid: "foo" })
                .where(filterRange(platform.transfers.created))
                .select(platform.transfers.$all),
            expectedResult: {
                sql: `SELECT "platform"."transfers".* FROM "platform"."transfers" WHERE "platform"."transfers"."their_gitid" = $1 AND "platform"."transfers"."created" >= $2 AND "platform"."transfers"."created" <= $3`,
                parameters: ["foo", "2017-12-31T23:00:00.000Z", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        const { tokendistributions } = pub;
        return checkResult({
            query: sql
                .from(tokendistributions)
                .where({ id: 123 })
                .select(tokendistributions.base_amount, tokendistributions.contributed),
            expectedResult: {
                sql: `SELECT "public"."tokendistributions"."base_amount", "public"."tokendistributions"."contributed" FROM "public"."tokendistributions" WHERE "public"."tokendistributions"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        return checkResult({
            query: sql
                .from(users)
                .where({ gitid: "foo" })
                .select("id", "gitid", "username"),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."gitid", "public"."users"."username" FROM "public"."users" WHERE "public"."users"."gitid" = $1`,
                parameters: ["foo"]
            }
        });
    },
    function() {
        const usergitids = Array.from(new Set(["1", "1", "3", "4", "3"]));
        return checkResult({
            query: sql
                .from(users)
                .where(users.gitid.isIn(usergitids))
                .select("id", "gitid", "username"),
            expectedResult: {
                sql: `SELECT "public"."users"."id", "public"."users"."gitid", "public"."users"."username" FROM "public"."users" WHERE "public"."users"."gitid" IN ($1, $2, $3)`,
                parameters: ["1", "3", "4"]
            }
        });
    },
    function() {
        const { games } = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .insertInto(games)
                .value({
                    id: 123,
                    bonus_cents: null,
                    bonus_won: false,
                    meta_hash: "foo",
                    state: "open"
                })
                .returning(games.$all),
            expectedResult: {
                sql: `INSERT INTO "stellar"."games"("id", "bonus_cents", "bonus_won", "meta_hash", "state") VALUES ($1, $2, $3, $4, $5) RETURNING "stellar"."games".*`,
                parameters: [123, null, false, "foo", "open"]
            }
        });
    },
    function() {
        const { games } = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .from(games)
                .where({ id: 123 })
                .select(games.$all),
            expectedResult: {
                sql: `SELECT "stellar"."games".* FROM "stellar"."games" WHERE "stellar"."games"."id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        const { games } = new DynamicSchema("stellar");
        const previousbonus = sql.coalesce(
            sql
                .from(games)
                .where({ id: 123, bonus_won: false })
                .select(games.bonus_cents)
                .asExpression(),
            sql.val(0)
        ) as sql.Expression<typeof bigint>;
        return checkResult({
            query: sql
                .update(games)
                .where({ id: 123 })
                .set({
                    state: "ongoing",
                    bonus_cents: previousbonus.plus(333)
                })
                .returning("bonus_cents"),
            expectedResult: {
                sql: `UPDATE "stellar"."games" SET "state" = $1, "bonus_cents" = COALESCE((SELECT "stellar"."games"."bonus_cents" FROM "stellar"."games" WHERE "stellar"."games"."id" = $2 AND "stellar"."games"."bonus_won" = $3), $4) + $5 WHERE "stellar"."games"."id" = $6 RETURNING "stellar"."games"."bonus_cents"`,
                parameters: ["ongoing", 123, false, 0, 333, 123]
            }
        });
    },
    function() {
        const { games } = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .update(games)
                .where({ id: 123 })
                .set({ state: "completed" }),
            expectedResult: {
                sql: `UPDATE "stellar"."games" SET "state" = $1 WHERE "stellar"."games"."id" = $2`,
                parameters: ["completed", 123]
            }
        });
    },
    function() {
        const users = pub.users;
        const { games, plays } = new DynamicSchema("stellar");
        const c = 123;
        return checkResult({
            query: sql
                .update(users)
                .where({ id: 123 })
                .set({
                    uscent_balance: users.uscent_balance.minus(c),
                    token_abssum: users.token_abssum.plus(c),
                    trust_points: users.trust_points.plus(
                        sql
                            .val(c, sql.tInteger)
                            .mult(users.trust_acceleration.cast(sql.tInteger, false).plus(1))
                    ),
                    total_delta: users.total_delta.minus(c),
                    change_count: users.change_count.plus(1)
                })
                .returning(
                    users.uscent_balance,
                    users.tokens_added,
                    users.trust_points,
                    users.referrer_id
                ),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" - $1, "token_abssum" = "public"."users"."token_abssum" + $2, "trust_points" = "public"."users"."trust_points" + $3 * ("public"."users"."trust_acceleration"::integer + $4), "total_delta" = "public"."users"."total_delta" - $5, "change_count" = "public"."users"."change_count" + $6 WHERE "public"."users"."id" = $7 RETURNING "public"."users"."uscent_balance", "public"."users"."tokens_added", "public"."users"."trust_points", "public"."users"."referrer_id"`,
                parameters: [123, 123, 123, 1, 123, 1, 123]
            }
        });
    },
    function() {
        const { games, plays } = new DynamicSchema("stellar");

        return checkResult({
            query: sql
                .update(plays)
                .where({ game_id: 123, color: "red" })
                .set({
                    token_posdelta: floor(
                        plays.cents.mult(sql.val(123).cast(doublePrecision) as any)
                    )
                })
                .returning("user_id")
                .returning(plays.cents.plus(plays.token_posdelta).as("balanceAddition")),
            expectedResult: {
                sql: `UPDATE "stellar"."plays" SET "token_posdelta" = FLOOR("stellar"."plays"."cents" * $1::double precision) WHERE "stellar"."plays"."game_id" = $2 AND "stellar"."plays"."color" = $3 RETURNING "stellar"."plays"."user_id", "stellar"."plays"."cents" + "stellar"."plays"."token_posdelta" AS "balanceAddition"`,
                parameters: [123, 123, "red"]
            }
        });
    },
    function() {
        const balanceUpdates = [0, 0, 0, 0].map(() => ({ user_id: 123, delta: 123 }));
        const users = pub.users;
        const balanceUpdatesTable = sql
            .values({ user_id: bigint, delta: bigint }, balanceUpdates)
            .as("deltas");
        return checkResult({
            query: sql
                .update(pub.users)
                .from(balanceUpdatesTable)
                .where(users.id.isEqualTo(balanceUpdatesTable.user_id.cast(bigint, false)))
                .set({
                    uscent_balance: users.uscent_balance.plus(
                        balanceUpdatesTable.delta.cast(bigint, false)
                    ),
                    total_delta: users.total_delta.plus(
                        balanceUpdatesTable.delta.cast(bigint, false)
                    )
                })
                .returning(users.id, users.uscent_balance),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + "deltas"."delta"::bigint, "total_delta" = "public"."users"."total_delta" + "deltas"."delta"::bigint FROM (VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8)) AS "deltas"("user_id", "delta") WHERE "public"."users"."id" = "deltas"."user_id"::bigint RETURNING "public"."users"."id", "public"."users"."uscent_balance"`,
                parameters: [123, 123, 123, 123, 123, 123, 123, 123]
            }
        });
    },
    function() {
        const { games, plays } = new DynamicSchema("stellar");

        return checkResult({
            query: sql
                .from(plays)
                .where(plays.game_id.isAtLeast(100))
                .select(
                    plays.color,
                    plays.cents,
                    plays.game_id,
                    plays.user_id,
                    plays.token_posdelta
                ),
            expectedResult: {
                sql: `SELECT "stellar"."plays"."color", "stellar"."plays"."cents", "stellar"."plays"."game_id", "stellar"."plays"."user_id", "stellar"."plays"."token_posdelta" FROM "stellar"."plays" WHERE "stellar"."plays"."game_id" >= $1`,
                parameters: [100]
            }
        });
    },
    function() {
        const schema = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .update(schema.games)
                .where({ id: 123 })
                .set({ bonus_won: true })
                .returning("bonus_cents"),
            expectedResult: {
                sql: `UPDATE "stellar"."games" SET "bonus_won" = $1 WHERE "stellar"."games"."id" = $2 RETURNING "stellar"."games"."bonus_cents"`,
                parameters: [true, 123]
            }
        });
    },
    function() {
        const c = 50;
        return checkResult({
            query: sql
                .update(pub.users)
                .where({ id: 123 })
                .set({
                    uscent_balance: pub.users.uscent_balance.plus(c),
                    total_delta: pub.users.total_delta.plus(c)
                })
                .returning(pub.users.id, pub.users.uscent_balance),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1, "total_delta" = "public"."users"."total_delta" + $2 WHERE "public"."users"."id" = $3 RETURNING "public"."users"."id", "public"."users"."uscent_balance"`,
                parameters: [50, 50, 123]
            }
        });
    },
    function() {
        const schema = new DynamicSchema("stellar");
        return checkResult({
            query: sql.insertInto(schema.bonus_retrievals).value({
                game_id: 123,
                user_id: 123,
                type: "winner",
                cents: 123
            }),
            expectedResult: {
                sql: `INSERT INTO "stellar"."bonus_retrievals"("game_id", "user_id", "type", "cents") VALUES ($1, $2, $3, $4)`,
                parameters: [123, 123, "winner", 123]
            }
        });
    },
    function() {
        return checkResult({
            query: update(users)
                .where({ id: 123 })
                .set({
                    uscent_balance: users.uscent_balance.minus(123),
                    token_abssum: users.token_abssum.plus(123),
                    trust_points: users.trust_points.plus(
                        sql
                            .val(123, tInteger)
                            .mult(users.trust_acceleration.cast(tInteger, false).plus(1))
                    ),
                    total_delta: users.total_delta.minus(123),
                    change_count: users.change_count.plus(1)
                })
                .returning(
                    users.uscent_balance.as("newBalance"),
                    users.tokens_added,
                    users.trust_points,
                    users.referrer_id
                ),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" - $1, "token_abssum" = "public"."users"."token_abssum" + $2, "trust_points" = "public"."users"."trust_points" + $3 * ("public"."users"."trust_acceleration"::integer + $4), "total_delta" = "public"."users"."total_delta" - $5, "change_count" = "public"."users"."change_count" + $6 WHERE "public"."users"."id" = $7 RETURNING "public"."users"."uscent_balance" AS "newBalance", "public"."users"."tokens_added", "public"."users"."trust_points", "public"."users"."referrer_id"`,
                parameters: [123, 123, 123, 1, 123, 1, 123]
            }
        });
    },
    function() {
        return checkResult({
            query: update(users)
                .where({ id: 123 })
                .set({
                    uscent_balance: users.uscent_balance.plus(123),
                    total_delta: users.total_delta.plus(123)
                })
                .returning(users.uscent_balance),
            expectedResult: {
                sql: `UPDATE "public"."users" SET "uscent_balance" = "public"."users"."uscent_balance" + $1, "total_delta" = "public"."users"."total_delta" + $2 WHERE "public"."users"."id" = $3 RETURNING "public"."users"."uscent_balance"`,
                parameters: [123, 123, 123]
            }
        });
    },

    function() {
        const _schema = firefly;
        {
            const { firefly } = _schema;
            return checkResult({
                query: from(firefly)
                    .where({
                        user_id: 123
                    })
                    .select(firefly.$all)
                    .orderBy(firefly.created.desc()),
                expectedResult: {
                    sql: `SELECT "firefly"."fireflys".* FROM "firefly"."fireflys" WHERE "firefly"."fireflys"."user_id" = $1 ORDER BY "firefly"."fireflys"."created" DESC`,
                    parameters: [123]
                }
            });
        }
    },
    function() {
        const _schema = firefly;
        {
            const { firefly, codes } = _schema;
            return checkResult({
                query: from(firefly)
                    .where({
                        user_id: 123
                    })
                    .leftJoin(codes)
                    .on({ id: firefly.code })
                    .select(firefly.$all)
                    .select(codes.server_code, codes.client_code, codes.active.as("code_active"))
                    .orderBy(firefly.created.desc())
                    .limit(30),
                expectedResult: {
                    sql: `SELECT "firefly"."fireflys".*, "firefly"."codes"."server_code", "firefly"."codes"."client_code", "firefly"."codes"."active" AS "code_active" FROM "firefly"."fireflys" LEFT JOIN "firefly"."codes" ON "firefly"."codes"."id" = "firefly"."fireflys"."code" WHERE "firefly"."fireflys"."user_id" = $1 ORDER BY "firefly"."fireflys"."created" DESC LIMIT $2`,
                    parameters: [123, 30]
                }
            });
        }
    },
    function() {
        const _schema = firefly;
        {
            const { firefly, codes } = _schema;
            return checkResult({
                query: update(codes)
                    .where({ user_id: 123, active: true })
                    .set({ active: false })
                    .returning(
                        codes.user_id,
                        codes.server_code,
                        codes.client_code,
                        codes.last_nonce,
                        codes.active,
                        codes.id,
                        codes.created
                    ),
                expectedResult: {
                    sql: `UPDATE "firefly"."codes" SET "active" = $1 WHERE "firefly"."codes"."user_id" = $2 AND "firefly"."codes"."active" = $3 RETURNING "firefly"."codes"."user_id", "firefly"."codes"."server_code", "firefly"."codes"."client_code", "firefly"."codes"."last_nonce", "firefly"."codes"."active", "firefly"."codes"."id", "firefly"."codes"."created"`,
                    parameters: [false, 123, true]
                }
            });
        }
    },
    function() {
        const _schema = firefly;
        {
            const { firefly, codes } = _schema;
            return checkResult({
                query: update(codes)
                    .where({ user_id: 123, active: true, last_nonce: 0 })
                    .set({ client_code: "foo" })
                    .returning(codes.$all),
                expectedResult: {
                    sql: `UPDATE "firefly"."codes" SET "client_code" = $1 WHERE "firefly"."codes"."user_id" = $2 AND "firefly"."codes"."active" = $3 AND "firefly"."codes"."last_nonce" = $4 RETURNING "firefly"."codes".*`,
                    parameters: ["foo", 123, true, 0]
                }
            });
        }
    },
    function() {
        const _schema = firefly;
        {
            const { firefly, codes } = _schema;
            const query = () =>
                from(firefly)
                    .leftJoin(users)
                    .on({ id: firefly.user_id })
                    .where({ won: true })
                    .select(firefly.$all)
                    .select(users.username.as("username"), users.image.as("userimage"))
                    .orderBy(firefly.id.desc());
            let myQuery = query().limit(123);
            return checkResult({
                query: myQuery,
                expectedResult: {
                    sql: `SELECT "firefly"."fireflys".*, "public"."users"."username" AS "username", "public"."users"."image" AS "userimage" FROM "firefly"."fireflys" LEFT JOIN "public"."users" ON "public"."users"."id" = "firefly"."fireflys"."user_id" WHERE "firefly"."fireflys"."won" = $1 ORDER BY "firefly"."fireflys"."id" DESC LIMIT $2`,
                    parameters: [true, 123]
                }
            });
        }
    },
    function() {
        const _schema = firefly;
        {
            const { firefly, codes } = _schema;
            return checkResult({
                query: from(firefly).select(firefly.$all.count().as("count")),
                expectedResult: {
                    sql: `SELECT COUNT("firefly"."fireflys".*) AS "count" FROM "firefly"."fireflys"`,
                    parameters: []
                }
            });
        }
    },
    function() {
        const ago = dateNow();
        return checkResult({
            query: from(transfers)
                .where({ state: "reserved" })
                .where(transfers.created.isLessThan(ago))
                .select("id", "our_items"),
            expectedResult: {
                sql: `SELECT "platform"."transfers"."id", "platform"."transfers"."our_items" FROM "platform"."transfers" WHERE "platform"."transfers"."state" = $1 AND "platform"."transfers"."created" < $2`,
                parameters: ["reserved", "2018-01-01T00:00:00.000Z"]
            }
        });
    },
    function() {
        return checkResult({
            query: sql.from(item_types).select("market_hash_name", "uscents"),
            expectedResult: {
                sql: `SELECT "platform"."item_types"."market_hash_name", "platform"."item_types"."uscents" FROM "platform"."item_types"`,
                parameters: []
            }
        });
    },
    function() {
        const stellar = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .from(stellar.games)
                .where(stellar.games.state.isEqualTo("completed"))
                .where({ id: 123 })
                .select(
                    stellar.games.id,
                    stellar.games.created,
                    stellar.games.bonus_cents,
                    stellar.games.bonus_won,
                    stellar.games.meta_hash
                ),
            expectedResult: {
                sql: `SELECT "stellar"."games"."id", "stellar"."games"."created", "stellar"."games"."bonus_cents", "stellar"."games"."bonus_won", "stellar"."games"."meta_hash" FROM "stellar"."games" WHERE "stellar"."games"."state" = $1 AND "stellar"."games"."id" = $2`,
                parameters: ["completed", 123]
            }
        });
    },
    function() {
        const stellar = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .from(stellar.plays)
                .innerJoin(users)
                .on({ id: stellar.plays.user_id })
                .where({ game_id: 123 })
                .select(
                    users.username,
                    stellar.plays.cents,
                    stellar.plays.token_posdelta,
                    stellar.plays.color,
                    stellar.plays.user_id
                ),
            expectedResult: {
                sql: `SELECT "public"."users"."username", "stellar"."plays"."cents", "stellar"."plays"."token_posdelta", "stellar"."plays"."color", "stellar"."plays"."user_id" FROM "stellar"."plays" JOIN "public"."users" ON "public"."users"."id" = "stellar"."plays"."user_id" WHERE "stellar"."plays"."game_id" = $1`,
                parameters: [123]
            }
        });
    },
    function() {
        const stellar = new DynamicSchema("stellar");
        return checkResult({
            query: sql
                .from(stellar.bonus_retrievals)
                .where({ game_id: 123 })
                .select(
                    stellar.bonus_retrievals.user_id,
                    stellar.bonus_retrievals.cents,
                    stellar.bonus_retrievals.type
                ),
            expectedResult: {
                sql: `SELECT "stellar"."bonus_retrievals"."user_id", "stellar"."bonus_retrievals"."cents", "stellar"."bonus_retrievals"."type" FROM "stellar"."bonus_retrievals" WHERE "stellar"."bonus_retrievals"."game_id" = $1`,
                parameters: [123]
            }
        });
    }
];
