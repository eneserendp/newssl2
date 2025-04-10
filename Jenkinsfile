pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "newssl2"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/eneserendp/newssl2'
            }
        }

        stage('Stop Running Containers') {
            steps {
                script {
                    sh 'docker-compose down || true'
                }
            }
        }

        stage('Rebuild and Restart') {
            steps {
                script {
                    sh 'docker-compose --env-file .env up -d --build'
                }
            }
        }
    }

    post {
        success {
            echo '🚀 Uygulama başarıyla güncellendi!'
        }
        failure {
            echo '❌ Bir hata oluştu. Logları kontrol et.'
        }
    }
}
