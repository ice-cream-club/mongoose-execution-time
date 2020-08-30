export interface LogExecutionTimeConfig {
    logger?: any;
    loggerLevel?: string;
    loggerVerbosity?: LoggerVerbosity
}

export enum LoggerVerbosity  {
    Normal,
    High
}

let logger : any = console;
let loggerLevel: string = 'debug';
let loggerVerbosity : LoggerVerbosity = LoggerVerbosity.High;

export function logExecutionTime (targetSchema : any, config ?: LogExecutionTimeConfig) {

    targetSchema.query.additionalLogProperties = function(additionalProperties: Object | string | number | boolean) {
        this.__additionalProperties = additionalProperties;
        return this;
    };

    if(!config) {
        config  = {} as LogExecutionTimeConfig;
    }
    if(config.logger) {
        logger = config.logger;
    }
    if(config.loggerLevel) {
        loggerLevel = config.loggerLevel;
    }
    if(config.loggerVerbosity) {
        loggerVerbosity = config.loggerVerbosity;
    }

    const targetMethods = [
        'find',
        'findOne',
        'count',
        'countDocuments',
        'estimatedDocumentCount',
        'findOneAndUpdate',
        'findOneAndRemove',
        'findOneAndDelete',
        'deleteOne',
        'deleteMany',
        'remove',
    ]

    targetMethods.forEach( method => {
        targetSchema.pre(method, preQueryHook);
        targetSchema.post(method, postQueryHook);
    })
}

function preQueryHook() {
    // @ts-ignore
    this.__startTime = Date.now();
}
function postQueryHook() {

    // @ts-ignore
    const target = this;

    if (target.__startTime != null) {
        loggingFunction(
            target.op,
            target._collection.collectionName,
            Date.now() - target.__startTime,
            target._conditions,
            target._update,
            target.__additionalProperties
        )
    }
}
function loggingFunction(
    operation: string,
    collectionName: string,
    executionTimeMS: number,
    filter: Object | null,
    update: Object | null,
    additionalLogProperties: any) {

    let logProperties: any = null;

    if(loggerVerbosity == LoggerVerbosity.High) {

        logProperties = {
            filter
        }

        if(update) {
            logProperties.update = update
        }
    }


    if(additionalLogProperties) {
        logProperties = logProperties
            ? { ...logProperties, additionalLogProperties }
            : { additionalLogProperties }
    }

    logger[loggerLevel](`Query: ${operation} in ${collectionName} completed in: ${executionTimeMS} ms`, logProperties)
}




