// Boot Optimizer Frontend Application
// Copyright (C) 2025 AI-Assisted Development Team

class BootOptimizer {
    constructor() {
        this.bootData = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadFile(e.target.files[0]);
        });

        // Load sample data button
        document.getElementById('loadSampleData').addEventListener('click', () => {
            this.loadSampleData();
        });

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    loadFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processBootData(data);
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    loadSampleData() {
        // Sample boot profile data
        const sampleData = {
            timestamp: new Date().toISOString(),
            total_time_ms: 8452,
            stages: [
                { name: 'Firmware', time_ms: 2100 },
                { name: 'Loader', time_ms: 1200 },
                { name: 'Kernel', time_ms: 2800 },
                { name: 'Initrd', time_ms: 950 },
                { name: 'Userspace', time_ms: 1402 }
            ],
            slow_services: [
                { name: 'NetworkManager.service', time_ms: 2341, active_ms: 2341 },
                { name: 'systemd-udevd.service', time_ms: 1876, active_ms: 1876 },
                { name: 'plymouth-start.service', time_ms: 1523, active_ms: 1523 },
                { name: 'accounts-daemon.service', time_ms: 1234, active_ms: 1234 },
                { name: 'ModemManager.service', time_ms: 987, active_ms: 987 },
                { name: 'gdm.service', time_ms: 876, active_ms: 876 },
                { name: 'systemd-logind.service', time_ms: 654, active_ms: 654 },
                { name: 'bluetooth.service', time_ms: 543, active_ms: 543 }
            ],
            recommendations: [
                {
                    type: 'firmware',
                    severity: 'high',
                    issue: 'Firmware initialization takes 2.10s',
                    suggestion: 'Enable Fast Boot in BIOS/UEFI settings',
                    ai_insight: 'Modern UEFI firmware can skip POST checks and reduce boot time by 50-70%.'
                },
                {
                    type: 'kernel',
                    severity: 'medium',
                    issue: 'Kernel initialization takes 2.80s',
                    suggestion: 'Reduce kernel modules, optimize initramfs size',
                    ai_insight: 'Kernel can be optimized by disabling unused drivers and using kernel compression.'
                },
                {
                    type: 'service',
                    severity: 'high',
                    target: 'NetworkManager.service',
                    issue: 'NetworkManager.service takes 2.34s',
                    suggestion: 'Consider lazy loading or moving to after graphical.target',
                    ai_insight: 'Deferring non-essential services can improve perceived boot time by 30-50%.'
                }
            ]
        };

        this.processBootData(sampleData);
    }

    processBootData(data) {
        this.bootData = data;

        // Show dashboard
        document.getElementById('dashboard').style.display = 'block';

        // Update summary cards
        this.updateSummaryCards();

        // Render all visualizations
        this.renderTimeline();
        this.renderStages();
        this.renderServices();
        this.renderRecommendations();
    }

    updateSummaryCards() {
        const data = this.bootData;

        // Total boot time
        document.getElementById('totalTime').textContent =
            `${(data.total_time_ms / 1000).toFixed(2)}s`;

        // Slowest stage
        if (data.stages && data.stages.length > 0) {
            const slowest = data.stages.reduce((prev, current) =>
                current.time_ms > prev.time_ms ? current : prev
            );
            document.getElementById('slowestStage').textContent =
                `${slowest.name} (${(slowest.time_ms / 1000).toFixed(2)}s)`;
        }

        // Optimization potential
        const highSeverity = data.recommendations?.filter(r =>
            r.severity === 'high' || r.severity === 'critical'
        ).length || 0;
        const potentialSavings = data.stages?.reduce((sum, stage) =>
            stage.time_ms > 2000 ? sum + (stage.time_ms * 0.3) : sum, 0
        ) || 0;
        document.getElementById('optimizationPotential').textContent =
            `~${(potentialSavings / 1000).toFixed(1)}s`;

        // Bottleneck count
        document.getElementById('bottleneckCount').textContent =
            data.recommendations?.length || 0;
    }

    renderTimeline() {
        const container = document.getElementById('timelineChart');
        if (!this.bootData.stages) return;

        const stages = this.bootData.stages;
        let html = '<div class="timeline-chart">';

        let currentTime = 0;
        stages.forEach(stage => {
            const percentage = (stage.time_ms / this.bootData.total_time_ms) * 100;
            const color = this.getStageColor(stage.name);

            html += `
                <div class="timeline-item" style="width: ${percentage}%; background: ${color};">
                    <div class="timeline-label">${stage.name}</div>
                    <div class="timeline-time">${(stage.time_ms / 1000).toFixed(2)}s</div>
                </div>
            `;

            currentTime += stage.time_ms;
        });

        html += '</div>';

        // Add CSS for timeline
        html += `
            <style>
                .timeline-chart {
                    display: flex;
                    width: 100%;
                    height: 100px;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 20px;
                }
                .timeline-item {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 8px;
                    color: white;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .timeline-item:hover {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
                .timeline-label {
                    font-size: 0.9em;
                    margin-bottom: 4px;
                }
                .timeline-time {
                    font-size: 1.2em;
                }
            </style>
        `;

        container.innerHTML = html;
    }

    renderStages() {
        const chartContainer = document.getElementById('stagesChart');
        const tableContainer = document.getElementById('stagesTable');

        if (!this.bootData.stages) return;

        // Render bar chart
        let chartHTML = '<div class="stages-chart">';
        this.bootData.stages.forEach(stage => {
            const percentage = (stage.time_ms / this.bootData.total_time_ms) * 100;
            const color = this.getStageColor(stage.name);

            chartHTML += `
                <div class="stage-bar-container">
                    <div class="stage-name">${stage.name}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background: ${color};">
                            ${(stage.time_ms / 1000).toFixed(2)}s (${percentage.toFixed(1)}%)
                        </div>
                    </div>
                </div>
            `;
        });
        chartHTML += '</div>';

        chartHTML += `
            <style>
                .stages-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .stage-bar-container {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .stage-name {
                    min-width: 120px;
                    font-weight: 600;
                }
            </style>
        `;

        chartContainer.innerHTML = chartHTML;

        // Render table
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Stage</th>
                        <th>Time (ms)</th>
                        <th>Time (s)</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.bootData.stages.forEach(stage => {
            const percentage = (stage.time_ms / this.bootData.total_time_ms) * 100;
            tableHTML += `
                <tr>
                    <td><strong>${stage.name}</strong></td>
                    <td>${stage.time_ms.toFixed(0)}</td>
                    <td>${(stage.time_ms / 1000).toFixed(3)}</td>
                    <td>${percentage.toFixed(1)}%</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    renderServices() {
        const chartContainer = document.getElementById('servicesChart');
        const tableContainer = document.getElementById('servicesTable');

        if (!this.bootData.slow_services) return;

        const services = this.bootData.slow_services.slice(0, 10); // Top 10

        // Render horizontal bar chart
        let chartHTML = '<div class="services-chart">';
        services.forEach((service, index) => {
            const maxTime = Math.max(...services.map(s => s.time_ms));
            const percentage = (service.time_ms / maxTime) * 100;

            chartHTML += `
                <div class="service-bar-container">
                    <div class="service-rank">#${index + 1}</div>
                    <div class="service-info">
                        <div class="service-name">${service.name}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%;">
                                ${(service.time_ms / 1000).toFixed(2)}s
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        chartHTML += '</div>';

        chartHTML += `
            <style>
                .services-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .service-bar-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .service-rank {
                    min-width: 40px;
                    font-size: 1.2em;
                    font-weight: 700;
                    color: var(--text-secondary);
                }
                .service-info {
                    flex: 1;
                }
                .service-name {
                    margin-bottom: 4px;
                    font-weight: 600;
                    font-size: 0.9em;
                }
            </style>
        `;

        chartContainer.innerHTML = chartHTML;

        // Render table
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Service</th>
                        <th>Time (ms)</th>
                        <th>Time (s)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        services.forEach((service, index) => {
            tableHTML += `
                <tr>
                    <td><strong>#${index + 1}</strong></td>
                    <td>${service.name}</td>
                    <td>${service.time_ms.toFixed(0)}</td>
                    <td>${(service.time_ms / 1000).toFixed(3)}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    renderRecommendations() {
        const container = document.getElementById('recommendationsList');

        if (!this.bootData.recommendations || this.bootData.recommendations.length === 0) {
            container.innerHTML = `
                <div class="no-recommendations">
                    <h3>✅ Excellent!</h3>
                    <p>No major optimization opportunities detected. Your system boot is well optimized.</p>
                </div>
            `;
            return;
        }

        let html = '';

        this.bootData.recommendations.forEach((rec, index) => {
            const icon = this.getSeverityIcon(rec.severity);

            html += `
                <div class="recommendation-card severity-${rec.severity}">
                    <div class="recommendation-header">
                        <div class="recommendation-icon">${icon}</div>
                        <div class="recommendation-title">
                            ${rec.target || rec.type}
                        </div>
                    </div>
                    <div class="recommendation-meta">
                        <span class="badge severity-${rec.severity}">
                            ${rec.severity.toUpperCase()}
                        </span>
                        <span class="badge">
                            ${rec.type}
                        </span>
                    </div>
                    <div class="recommendation-description">
                        <strong>Issue:</strong> ${rec.issue}
                    </div>
                    <div class="recommendation-description">
                        <strong>Suggestion:</strong> ${rec.suggestion}
                    </div>
            `;

            if (rec.ai_insight) {
                html += `
                    <div class="ai-insight">
                        <div>
                            <strong>AI Insight:</strong> ${rec.ai_insight}
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
        });

        container.innerHTML = html;
    }

    getStageColor(stageName) {
        const colors = {
            'Firmware': '#ef4444',
            'Loader': '#f59e0b',
            'Kernel': '#eab308',
            'Initrd': '#84cc16',
            'Userspace': '#10b981',
            'default': '#3b82f6'
        };
        return colors[stageName] || colors.default;
    }

    getSeverityIcon(severity) {
        const icons = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢',
            'info': 'ℹ️'
        };
        return icons[severity] || icons.info;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BootOptimizer();
});
