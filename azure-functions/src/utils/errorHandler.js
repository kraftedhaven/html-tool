import { ApplicationInsights } from '@azure/monitor-opentelemetry';

class AzureErrorHandler {
  constructor() {
    this.appInsights = null;
    this.initializeAppInsights();
  }

  initializeAppInsights() {
    try {
      const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
      if (connectionString) {
        ApplicationInsights.setup(connectionString);
        ApplicationInsights.start();
        this.appInsights = ApplicationInsights.defaultClient;
        console.log('Application Insights initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize Application Insights:', error.message);
    }
  }

  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      ...context
    };

    // Log to console for local development
    console.error('Azure Function Error:', errorInfo);

    // Log to Application Insights if available
    if (this.appInsights) {
      this.appInsights.trackException({
        exception: error,
        properties: context
      });
    }

    return errorInfo;
  }

  logEvent(eventName, properties = {}) {
    console.log(`Event: ${eventName}`, properties);

    if (this.appInsights) {
      this.appInsights.trackEvent({
        name: eventName,
        properties
      });
    }
  }

  logMetric(name, value, properties = {}) {
    console.log(`Metric: ${name} = ${value}`, properties);

    if (this.appInsights) {
      this.appInsights.trackMetric({
        name,
        value,
        properties
      });
    }
  }

  handleApiError(error, operation, context = {}) {
    const errorContext = {
      operation,
      ...context
    };

    // Handle specific API errors
    if (error.response) {
      const { status, data } = error.response;
      errorContext.httpStatus = status;
      errorContext.responseData = data;

      // Handle rate limiting
      if (status === 429) {
        this.logEvent('RateLimitExceeded', errorContext);
        return {
          status: 429,
          jsonBody: { 
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: error.response.headers['retry-after'] || 60
          }
        };
      }

      // Handle authentication errors
      if (status === 401) {
        this.logEvent('AuthenticationFailed', errorContext);
        return {
          status: 401,
          jsonBody: { error: 'Authentication failed. Please check your credentials.' }
        };
      }

      // Handle server errors
      if (status >= 500) {
        this.logError(error, errorContext);
        return {
          status: 502,
          jsonBody: { error: 'External service temporarily unavailable.' }
        };
      }
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      this.logEvent('RequestTimeout', errorContext);
      return {
        status: 504,
        jsonBody: { error: 'Request timeout. Please try again.' }
      };
    }

    // Log and return generic error
    this.logError(error, errorContext);
    return {
      status: 500,
      jsonBody: { error: error.message || 'An internal server error occurred.' }
    };
  }

  createSuccessResponse(data, operation, context = {}) {
    this.logEvent('OperationSuccess', { operation, ...context });
    
    return {
      status: 200,
      jsonBody: { success: true, data }
    };
  }

  async withErrorHandling(operation, handler, context = {}) {
    try {
      const startTime = Date.now();
      const result = await handler();
      const duration = Date.now() - startTime;
      
      this.logMetric(`${operation}_duration`, duration, context);
      return result;
    } catch (error) {
      return this.handleApiError(error, operation, context);
    }
  }
}

export const errorHandler = new AzureErrorHandler();