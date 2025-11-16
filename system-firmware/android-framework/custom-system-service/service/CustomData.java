package com.android.server.custom;

import android.os.Parcel;
import android.os.Parcelable;

/**
 * 自定義資料物件
 *
 * 實作 Parcelable 介面以支持跨進程傳輸
 */
public class CustomData implements Parcelable {
    private int mId;
    private String mName;
    private String mValue;
    private long mTimestamp;
    private int mType;

    // 資料類型常量
    public static final int TYPE_STRING = 0;
    public static final int TYPE_INTEGER = 1;
    public static final int TYPE_FLOAT = 2;
    public static final int TYPE_BOOLEAN = 3;

    public CustomData(int id, String name) {
        this(id, name, "", System.currentTimeMillis(), TYPE_STRING);
    }

    public CustomData(int id, String name, String value, long timestamp, int type) {
        mId = id;
        mName = name;
        mValue = value;
        mTimestamp = timestamp;
        mType = type;
    }

    protected CustomData(Parcel in) {
        mId = in.readInt();
        mName = in.readString();
        mValue = in.readString();
        mTimestamp = in.readLong();
        mType = in.readInt();
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(mId);
        dest.writeString(mName);
        dest.writeString(mValue);
        dest.writeLong(mTimestamp);
        dest.writeInt(mType);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<CustomData> CREATOR = new Creator<CustomData>() {
        @Override
        public CustomData createFromParcel(Parcel in) {
            return new CustomData(in);
        }

        @Override
        public CustomData[] newArray(int size) {
            return new CustomData[size];
        }
    };

    // Getters
    public int getId() {
        return mId;
    }

    public String getName() {
        return mName;
    }

    public String getValue() {
        return mValue;
    }

    public long getTimestamp() {
        return mTimestamp;
    }

    public int getType() {
        return mType;
    }

    // Setters
    public void setId(int id) {
        mId = id;
    }

    public void setName(String name) {
        mName = name;
    }

    public void setValue(String value) {
        mValue = value;
    }

    public void setTimestamp(long timestamp) {
        mTimestamp = timestamp;
    }

    public void setType(int type) {
        mType = type;
    }

    @Override
    public String toString() {
        return "CustomData{" +
                "id=" + mId +
                ", name='" + mName + '\'' +
                ", value='" + mValue + '\'' +
                ", timestamp=" + mTimestamp +
                ", type=" + mType +
                '}';
    }
}
