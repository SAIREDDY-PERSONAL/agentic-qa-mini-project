pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.48.0-jammy'
            args '-u root'
        }
    }
    
    environment {
        OPENAI_API_KEY = credentials('openai-api-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Run Agentic Tests') {
            steps {
                sh 'npx playwright test'
            }
        }
    }
    
    post {
        always {
            // Publish Playwright HTML Report in Jenkins
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright & LLM Eval Report'
            ])
            
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        }
    }
}