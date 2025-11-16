# HAL Audio 範例 (Audio HAL Example)

> Android 音訊硬體抽象層 (Audio HAL) 完整實作範例

## 專案概述

本專案展示如何實作 Android Audio HAL，包含 HIDL/AIDL 介面實作、音訊策略配置、音訊路由管理和音效處理等完整功能。

## 功能特性

- ✅ Audio HAL 4.0+ 介面實作
- ✅ 音訊輸入/輸出流管理
- ✅ 音訊參數配置
- ✅ 音訊路由與混音
- ✅ 音效處理支援
- ✅ 音訊策略管理
- ✅ A2DP/藍牙音訊支援
- ✅ 音訊焦點管理

## 架構設計

```
Audio HAL 架構
┌──────────────────────────────────────────┐
│     Application Layer                     │
│  ┌────────────────────────────────────┐  │
│  │   AudioTrack / AudioRecord         │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │
┌─────────────────┼────────────────────────┐
│   Framework Layer (AudioFlinger)          │
│  ┌──────────────▼─────────────────────┐  │
│  │   AudioPolicyService               │  │
│  │   AudioFlinger                     │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ HAL Interface
┌─────────────────▼────────────────────────┐
│   HAL Layer                               │
│  ┌────────────────────────────────────┐  │
│  │   Audio HAL Implementation         │  │
│  │   • Primary Device                 │  │
│  │   • A2DP Device                    │  │
│  │   • USB Device                     │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│   Hardware Layer                          │
│   Audio Codec / DSP                       │
└──────────────────────────────────────────┘
```

## 目錄結構

```
hal-audio-example/
├── README.md                        # 專案說明
├── hal/                             # HAL 實作
│   ├── AudioDevice.cpp             # 音訊設備實作
│   ├── AudioDevice.h
│   ├── PrimaryDevice.cpp           # 主音訊設備
│   ├── PrimaryDevice.h
│   ├── StreamOut.cpp               # 輸出流
│   ├── StreamOut.h
│   ├── StreamIn.cpp                # 輸入流
│   ├── StreamIn.h
│   └── Android.bp                  # 編譯配置
├── client/                          # 測試客戶端
│   ├── AudioHalTest.cpp            # HAL 測試程式
│   └── Android.bp
├── config/                          # 配置文件
│   ├── audio_policy_configuration.xml
│   ├── audio_effects.xml
│   └── mixer_paths.xml
└── docs/                            # 文檔
    ├── architecture.md
    ├── api-reference.md
    └── integration-guide.md
```

## HAL 介面實作

### AudioDevice.h

```cpp
#ifndef ANDROID_HARDWARE_AUDIO_DEVICE_H
#define ANDROID_HARDWARE_AUDIO_DEVICE_H

#include <android/hardware/audio/4.0/IDevice.h>
#include <android/hardware/audio/4.0/IStreamOut.h>
#include <android/hardware/audio/4.0/IStreamIn.h>
#include <hidl/MQDescriptor.h>
#include <hidl/Status.h>

namespace android {
namespace hardware {
namespace audio {
namespace V4_0 {
namespace implementation {

using ::android::hardware::audio::V4_0::IDevice;
using ::android::hardware::audio::V4_0::IStreamOut;
using ::android::hardware::audio::V4_0::IStreamIn;
using ::android::hardware::audio::V4_0::AudioConfig;
using ::android::hardware::audio::V4_0::DeviceAddress;
using ::android::hardware::Return;
using ::android::hardware::Void;
using ::android::hardware::hidl_vec;
using ::android::hardware::hidl_string;
using ::android::sp;

class AudioDevice : public IDevice {
public:
    AudioDevice();
    virtual ~AudioDevice();

    // IDevice 介面實作
    Return<Result> initCheck() override;

    Return<Result> setMasterVolume(float volume) override;
    Return<void> getMasterVolume(getMasterVolume_cb _hidl_cb) override;

    Return<Result> setMicMute(bool mute) override;
    Return<void> getMicMute(getMicMute_cb _hidl_cb) override;

    Return<Result> setMasterMute(bool mute) override;
    Return<void> getMasterMute(getMasterMute_cb _hidl_cb) override;

    Return<void> getInputBufferSize(
        const AudioConfig& config,
        getInputBufferSize_cb _hidl_cb) override;

    Return<void> openOutputStream(
        int32_t ioHandle,
        const DeviceAddress& device,
        const AudioConfig& config,
        AudioOutputFlag flags,
        const SourceMetadata& sourceMetadata,
        openOutputStream_cb _hidl_cb) override;

    Return<void> openInputStream(
        int32_t ioHandle,
        const DeviceAddress& device,
        const AudioConfig& config,
        AudioInputFlag flags,
        const SinkMetadata& sinkMetadata,
        openInputStream_cb _hidl_cb) override;

    Return<bool> supportsAudioPatches() override;

    Return<void> createAudioPatch(
        const hidl_vec<AudioPortConfig>& sources,
        const hidl_vec<AudioPortConfig>& sinks,
        createAudioPatch_cb _hidl_cb) override;

    Return<Result> releaseAudioPatch(int32_t patch) override;

    Return<void> getAudioPort(
        const AudioPort& port,
        getAudioPort_cb _hidl_cb) override;

    Return<Result> setAudioPortConfig(
        const AudioPortConfig& config) override;

    Return<void> getHwAvSync(getHwAvSync_cb _hidl_cb) override;

    Return<Result> setScreenState(bool turnedOn) override;

    Return<void> getParameters(
        const hidl_vec<hidl_string>& keys,
        getParameters_cb _hidl_cb) override;

    Return<Result> setParameters(
        const hidl_vec<ParameterValue>& parameters) override;

    Return<void> getMicrophones(getMicrophones_cb _hidl_cb) override;

    Return<Result> setConnectedState(
        const DeviceAddress& address,
        bool connected) override;

    Return<Result> close() override;

private:
    float mMasterVolume;
    bool mMasterMute;
    bool mMicMute;
    bool mScreenState;

    std::vector<sp<IStreamOut>> mOutputStreams;
    std::vector<sp<IStreamIn>> mInputStreams;

    Result checkConfig(const AudioConfig& config);
    Result applyParameters(const hidl_vec<ParameterValue>& parameters);
};

} // namespace implementation
} // namespace V4_0
} // namespace audio
} // namespace hardware
} // namespace android

#endif // ANDROID_HARDWARE_AUDIO_DEVICE_H
```

### StreamOut.h

```cpp
#ifndef ANDROID_HARDWARE_AUDIO_STREAM_OUT_H
#define ANDROID_HARDWARE_AUDIO_STREAM_OUT_H

#include <android/hardware/audio/4.0/IStreamOut.h>
#include <fmq/MessageQueue.h>
#include <hidl/MQDescriptor.h>
#include <hidl/Status.h>
#include <atomic>
#include <memory>

namespace android {
namespace hardware {
namespace audio {
namespace V4_0 {
namespace implementation {

using ::android::hardware::audio::V4_0::IStreamOut;
using ::android::hardware::audio::V4_0::IStreamOutCallback;
using ::android::hardware::audio::V4_0::AudioConfig;
using ::android::hardware::audio::V4_0::AudioDrain;
using ::android::hardware::Return;
using ::android::hardware::Void;
using ::android::hardware::kSynchronizedReadWrite;
using ::android::hardware::MessageQueue;

using DataMQ = MessageQueue<uint8_t, kSynchronizedReadWrite>;
using DataMQDesc = MQDescriptorSync<uint8_t>;
using StatusMQ = MessageQueue<WriteStatus, kSynchronizedReadWrite>;
using StatusMQDesc = MQDescriptorSync<WriteStatus>;

class StreamOut : public IStreamOut {
public:
    StreamOut(int32_t ioHandle, const AudioConfig& config);
    virtual ~StreamOut();

    // IStream 介面
    Return<uint64_t> getFrameSize() override;
    Return<uint64_t> getFrameCount() override;
    Return<uint64_t> getBufferSize() override;
    Return<uint32_t> getSampleRate() override;

    Return<void> getSupportedSampleRates(
        AudioFormat format,
        getSupportedSampleRates_cb _hidl_cb) override;

    Return<void> getSupportedChannelMasks(
        AudioFormat format,
        getSupportedChannelMasks_cb _hidl_cb) override;

    Return<Result> setSampleRate(uint32_t sampleRateHz) override;

    Return<AudioChannelMask> getChannelMask() override;
    Return<Result> setChannelMask(AudioChannelMask mask) override;

    Return<AudioFormat> getFormat() override;
    Return<void> getSupportedFormats(
        getSupportedFormats_cb _hidl_cb) override;
    Return<Result> setFormat(AudioFormat format) override;

    Return<void> getAudioProperties(
        getAudioProperties_cb _hidl_cb) override;

    Return<Result> addEffect(uint64_t effectId) override;
    Return<Result> removeEffect(uint64_t effectId) override;

    Return<Result> standby() override;

    Return<void> getDevices(getDevices_cb _hidl_cb) override;
    Return<Result> setDevices(
        const hidl_vec<DeviceAddress>& devices) override;

    Return<void> getParameters(
        const hidl_vec<hidl_string>& keys,
        getParameters_cb _hidl_cb) override;

    Return<Result> setParameters(
        const hidl_vec<ParameterValue>& parameters) override;

    Return<Result> setHwAvSync(uint32_t hwAvSync) override;

    Return<Result> close() override;

    // IStreamOut 特定介面
    Return<uint32_t> getLatency() override;

    Return<Result> setVolume(float left, float right) override;

    Return<void> prepareForWriting(
        uint32_t frameSize,
        uint32_t framesCount,
        prepareForWriting_cb _hidl_cb) override;

    Return<void> getRenderPosition(
        getRenderPosition_cb _hidl_cb) override;

    Return<void> getNextWriteTimestamp(
        getNextWriteTimestamp_cb _hidl_cb) override;

    Return<Result> setCallback(
        const sp<IStreamOutCallback>& callback) override;

    Return<Result> clearCallback() override;

    Return<void> supportsPauseAndResume(
        supportsPauseAndResume_cb _hidl_cb) override;

    Return<Result> pause() override;
    Return<Result> resume() override;

    Return<bool> supportsDrain() override;

    Return<Result> drain(AudioDrain type) override;

    Return<Result> flush() override;

    Return<void> getPresentationPosition(
        getPresentationPosition_cb _hidl_cb) override;

    Return<Result> start() override;
    Return<Result> stop() override;

    Return<void> createMmapBuffer(
        int32_t minSizeFrames,
        createMmapBuffer_cb _hidl_cb) override;

    Return<void> getMmapPosition(
        getMmapPosition_cb _hidl_cb) override;

    Return<Result> updateSourceMetadata(
        const SourceMetadata& sourceMetadata) override;

private:
    int32_t mIoHandle;
    AudioConfig mConfig;

    std::atomic<uint32_t> mSampleRate;
    std::atomic<AudioChannelMask> mChannelMask;
    std::atomic<AudioFormat> mFormat;

    float mLeftVolume;
    float mRightVolume;

    std::unique_ptr<DataMQ> mDataMQ;
    std::unique_ptr<StatusMQ> mStatusMQ;

    sp<IStreamOutCallback> mCallback;

    std::atomic<uint64_t> mFramesWritten;
    std::atomic<uint64_t> mFramesPresented;

    bool mIsPaused;
    bool mIsStandby;

    Result writeImpl(const uint8_t* buffer, size_t bytes);
    void updatePresentationPosition();
};

} // namespace implementation
} // namespace V4_0
} // namespace audio
} // namespace hardware
} // namespace android

#endif // ANDROID_HARDWARE_AUDIO_STREAM_OUT_H
```

## 音訊策略配置

### audio_policy_configuration.xml

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!-- Audio Policy Configuration for Custom HAL -->
<audioPolicyConfiguration version="1.0" xmlns:xi="http://www.w3.org/2001/XInclude">
    <!-- Global Configuration -->
    <globalConfiguration speaker_drc_enabled="true"/>

    <!-- Audio HAL Modules -->
    <modules>
        <!-- Primary Audio Module -->
        <module name="primary" halVersion="3.0">
            <attachedDevices>
                <item>Speaker</item>
                <item>Built-In Mic</item>
            </attachedDevices>

            <defaultOutputDevice>Speaker</defaultOutputDevice>

            <!-- Mixed Output Profile -->
            <mixPorts>
                <mixPort name="primary output" role="source" flags="AUDIO_OUTPUT_FLAG_PRIMARY">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </mixPort>

                <mixPort name="deep_buffer" role="source"
                         flags="AUDIO_OUTPUT_FLAG_DEEP_BUFFER">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </mixPort>

                <mixPort name="compressed_offload" role="source"
                         flags="AUDIO_OUTPUT_FLAG_DIRECT|AUDIO_OUTPUT_FLAG_COMPRESS_OFFLOAD|AUDIO_OUTPUT_FLAG_NON_BLOCKING">
                    <profile name="" format="AUDIO_FORMAT_MP3"
                             samplingRates="8000,11025,12000,16000,22050,24000,32000,44100,48000"
                             channelMasks="AUDIO_CHANNEL_OUT_STEREO,AUDIO_CHANNEL_OUT_MONO"/>
                    <profile name="" format="AUDIO_FORMAT_AAC"
                             samplingRates="8000,11025,12000,16000,22050,24000,32000,44100,48000,64000,88200,96000"
                             channelMasks="AUDIO_CHANNEL_OUT_STEREO,AUDIO_CHANNEL_OUT_MONO"/>
                </mixPort>

                <mixPort name="primary input" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="8000,11025,12000,16000,22050,24000,32000,44100,48000"
                             channelMasks="AUDIO_CHANNEL_IN_MONO,AUDIO_CHANNEL_IN_STEREO"/>
                </mixPort>
            </mixPorts>

            <!-- Device Ports -->
            <devicePorts>
                <!-- Output Devices -->
                <devicePort tagName="Speaker" type="AUDIO_DEVICE_OUT_SPEAKER" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </devicePort>

                <devicePort tagName="Wired Headset" type="AUDIO_DEVICE_OUT_WIRED_HEADSET" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </devicePort>

                <devicePort tagName="Wired Headphones" type="AUDIO_DEVICE_OUT_WIRED_HEADPHONE" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </devicePort>

                <devicePort tagName="BT SCO" type="AUDIO_DEVICE_OUT_BLUETOOTH_SCO" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="8000,16000" channelMasks="AUDIO_CHANNEL_OUT_MONO"/>
                </devicePort>

                <devicePort tagName="BT SCO Headset" type="AUDIO_DEVICE_OUT_BLUETOOTH_SCO_HEADSET" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="8000,16000" channelMasks="AUDIO_CHANNEL_OUT_MONO"/>
                </devicePort>

                <!-- Input Devices -->
                <devicePort tagName="Built-In Mic" type="AUDIO_DEVICE_IN_BUILTIN_MIC" role="source">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="8000,11025,12000,16000,22050,24000,32000,44100,48000"
                             channelMasks="AUDIO_CHANNEL_IN_MONO,AUDIO_CHANNEL_IN_STEREO"/>
                </devicePort>

                <devicePort tagName="Wired Headset Mic" type="AUDIO_DEVICE_IN_WIRED_HEADSET" role="source">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="8000,11025,12000,16000,22050,24000,32000,44100,48000"
                             channelMasks="AUDIO_CHANNEL_IN_MONO"/>
                </devicePort>

                <devicePort tagName="BT SCO Headset Mic" type="AUDIO_DEVICE_IN_BLUETOOTH_SCO_HEADSET" role="source">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="8000,16000" channelMasks="AUDIO_CHANNEL_IN_MONO"/>
                </devicePort>
            </devicePorts>

            <!-- Audio Routes -->
            <routes>
                <route type="mix" sink="Speaker" sources="primary output,deep_buffer,compressed_offload"/>
                <route type="mix" sink="Wired Headset" sources="primary output,deep_buffer,compressed_offload"/>
                <route type="mix" sink="Wired Headphones" sources="primary output,deep_buffer,compressed_offload"/>
                <route type="mix" sink="BT SCO" sources="primary output,deep_buffer"/>
                <route type="mix" sink="BT SCO Headset" sources="primary output,deep_buffer"/>

                <route type="mix" sink="primary input" sources="Built-In Mic,Wired Headset Mic,BT SCO Headset Mic"/>
            </routes>
        </module>

        <!-- A2DP Module -->
        <module name="a2dp" halVersion="2.0">
            <mixPorts>
                <mixPort name="a2dp output" role="source"/>
            </mixPorts>

            <devicePorts>
                <devicePort tagName="BT A2DP Out" type="AUDIO_DEVICE_OUT_BLUETOOTH_A2DP" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="44100,48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </devicePort>

                <devicePort tagName="BT A2DP Headphones" type="AUDIO_DEVICE_OUT_BLUETOOTH_A2DP_HEADPHONES" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="44100,48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </devicePort>

                <devicePort tagName="BT A2DP Speaker" type="AUDIO_DEVICE_OUT_BLUETOOTH_A2DP_SPEAKER" role="sink">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="44100,48000" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </devicePort>
            </devicePorts>

            <routes>
                <route type="mix" sink="BT A2DP Out" sources="a2dp output"/>
                <route type="mix" sink="BT A2DP Headphones" sources="a2dp output"/>
                <route type="mix" sink="BT A2DP Speaker" sources="a2dp output"/>
            </routes>
        </module>

        <!-- USB Module -->
        <module name="usb" halVersion="2.0">
            <mixPorts>
                <mixPort name="usb_accessory output" role="source">
                    <profile name="" format="AUDIO_FORMAT_PCM_16_BIT"
                             samplingRates="44100" channelMasks="AUDIO_CHANNEL_OUT_STEREO"/>
                </mixPort>
            </mixPorts>

            <devicePorts>
                <devicePort tagName="USB Device Out" type="AUDIO_DEVICE_OUT_USB_DEVICE" role="sink"/>
                <devicePort tagName="USB Headset Out" type="AUDIO_DEVICE_OUT_USB_HEADSET" role="sink"/>
            </devicePorts>

            <routes>
                <route type="mix" sink="USB Device Out" sources="usb_accessory output"/>
                <route type="mix" sink="USB Headset Out" sources="usb_accessory output"/>
            </routes>
        </module>
    </modules>

    <!-- Volume Tables -->
    <xi:include href="audio_policy_volumes.xml"/>
    <xi:include href="default_volume_tables.xml"/>
</audioPolicyConfiguration>
```

## 編譯配置

### hal/Android.bp

```blueprint
cc_library_shared {
    name: "android.hardware.audio@4.0-impl",
    defaults: ["hidl_defaults"],
    vendor: true,
    relative_install_path: "hw",

    srcs: [
        "AudioDevice.cpp",
        "PrimaryDevice.cpp",
        "StreamOut.cpp",
        "StreamIn.cpp",
    ],

    shared_libs: [
        "libbase",
        "libcutils",
        "libfmq",
        "libhardware",
        "libhidlbase",
        "liblog",
        "libutils",
        "android.hardware.audio@4.0",
        "android.hardware.audio.common@4.0",
    ],

    header_libs: [
        "libaudio_system_headers",
        "libhardware_headers",
    ],
}

cc_binary {
    name: "android.hardware.audio@4.0-service",
    defaults: ["hidl_defaults"],
    vendor: true,
    relative_install_path: "hw",
    init_rc: ["android.hardware.audio@4.0-service.rc"],

    srcs: ["service.cpp"],

    shared_libs: [
        "liblog",
        "libcutils",
        "libdl",
        "libbase",
        "libutils",
        "libhardware",
        "libhidlbase",
        "android.hardware.audio@4.0",
        "android.hardware.audio.common@4.0",
    ],
}
```

## 測試與驗證

### 播放測試

```bash
# 測試音訊播放
adb shell tinymix
adb shell tinyplay /sdcard/test.wav

# 測試音訊錄製
adb shell tinycap /sdcard/record.wav

# 查看音訊設備
adb shell dumpsys media.audio_flinger
adb shell dumpsys media.audio_policy
```

### 效能測試

```bash
# 測試延遲
adb shell audio_test latency

# 測試吞吐量
adb shell audio_test throughput

# 測試音質
adb shell audio_test quality
```

## 除錯指南

### 日誌查看

```bash
# Audio HAL 日誌
adb logcat -s AudioHAL:*

# AudioFlinger 日誌
adb logcat -s AudioFlinger:*

# 音訊策略日誌
adb logcat -s AudioPolicyManager:*
```

### 常見問題

1. **無聲音輸出**: 檢查音訊路由配置
2. **音訊延遲高**: 調整 buffer size 和採樣率
3. **雜音**: 檢查音訊格式和採樣率匹配
4. **音訊焦點問題**: 檢查 AudioPolicy 配置

## 參考資源

- [Android Audio HAL](https://source.android.com/docs/core/audio)
- [Audio Policy Configuration](https://source.android.com/docs/core/audio/audio-policy)
- [TinyALSA](https://github.com/tinyalsa/tinyalsa)

---

**版本**: 1.0.0
**最後更新**: 2025-11-16
**相容性**: Android 10+ (Audio HAL 4.0+)
