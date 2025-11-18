const { GraphQLScalarType, GraphQLError } = require('graphql');
const { Kind } = require('graphql/language');

/**
 * Custom DateTime Scalar
 * 處理 ISO 8601 格式的日期時間
 */
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.',

  serialize(value) {
    // 從資料庫讀取時：轉換為 ISO 字串
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new GraphQLError('DateTime cannot represent value: ' + value);
  },

  parseValue(value) {
    // 從客戶端變數接收時：轉換為 Date 物件
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError('DateTime cannot represent invalid date string: ' + value);
      }
      return date;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    throw new GraphQLError('DateTime cannot represent non-string/number value: ' + value);
  },

  parseLiteral(ast) {
    // 從查詢字串解析時：轉換為 Date 物件
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError('DateTime cannot represent invalid date string: ' + ast.value);
      }
      return date;
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    throw new GraphQLError('DateTime cannot represent non-string/number value');
  }
});

/**
 * Custom Email Scalar
 * 驗證並處理電子郵件地址
 */
const EmailScalar = new GraphQLScalarType({
  name: 'Email',
  description: 'A valid email address',

  serialize(value) {
    // 從資料庫讀取時：返回小寫的電子郵件
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new GraphQLError('Email cannot represent non-string value: ' + value);
  },

  parseValue(value) {
    // 從客戶端變數接收時：驗證並返回小寫的電子郵件
    if (typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const lowercaseEmail = value.toLowerCase().trim();

      if (!emailRegex.test(lowercaseEmail)) {
        throw new GraphQLError('Email must be a valid email address: ' + value);
      }

      return lowercaseEmail;
    }
    throw new GraphQLError('Email must be a string: ' + value);
  },

  parseLiteral(ast) {
    // 從查詢字串解析時：驗證並返回小寫的電子郵件
    if (ast.kind === Kind.STRING) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const lowercaseEmail = ast.value.toLowerCase().trim();

      if (!emailRegex.test(lowercaseEmail)) {
        throw new GraphQLError('Email must be a valid email address: ' + ast.value);
      }

      return lowercaseEmail;
    }
    throw new GraphQLError('Email must be a string');
  }
});

/**
 * Custom URL Scalar
 * 驗證並處理 URL
 */
const URLScalar = new GraphQLScalarType({
  name: 'URL',
  description: 'A valid URL string',

  serialize(value) {
    // 從資料庫讀取時：返回 URL 字串
    if (typeof value === 'string') {
      return value;
    }
    throw new GraphQLError('URL cannot represent non-string value: ' + value);
  },

  parseValue(value) {
    // 從客戶端變數接收時：驗證 URL
    if (typeof value === 'string') {
      try {
        new URL(value);
        return value;
      } catch (error) {
        throw new GraphQLError('URL must be a valid URL: ' + value);
      }
    }
    throw new GraphQLError('URL must be a string: ' + value);
  },

  parseLiteral(ast) {
    // 從查詢字串解析時：驗證 URL
    if (ast.kind === Kind.STRING) {
      try {
        new URL(ast.value);
        return ast.value;
      } catch (error) {
        throw new GraphQLError('URL must be a valid URL: ' + ast.value);
      }
    }
    throw new GraphQLError('URL must be a string');
  }
});

/**
 * Custom PositiveInt Scalar
 * 只接受正整數
 */
const PositiveIntScalar = new GraphQLScalarType({
  name: 'PositiveInt',
  description: 'Integers that are greater than 0',

  serialize(value) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }
    throw new GraphQLError('PositiveInt cannot represent non-positive integer: ' + value);
  },

  parseValue(value) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }
    throw new GraphQLError('PositiveInt must be a positive integer: ' + value);
  },

  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      const value = parseInt(ast.value, 10);
      if (value > 0) {
        return value;
      }
    }
    throw new GraphQLError('PositiveInt must be a positive integer');
  }
});

module.exports = {
  DateTimeScalar,
  EmailScalar,
  URLScalar,
  PositiveIntScalar
};
