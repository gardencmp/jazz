job "homepage-jazz$BRANCH_SUFFIX" {
  region     = "global"
  datacenters = ["*"]

  group "static" {
    count = 4

    network {
      port "http" {
        to = 3001
      }
    }

    constraint {
      attribute = "${node.class}"
      operator  = "="
      value     = "cloud"
    }

    spread {
      attribute = "${node.datacenter}"
      weight    = 100
    }

    constraint {
      distinct_hosts = true
    }

    task "server" {
      driver = "docker"

      config {
        image = "$DOCKER_TAG"
        ports = ["http"]

        auth = {
          username = "$DOCKER_USER"
          password = "$DOCKER_PASSWORD"
        }
      }

      service {
        tags = ["public"]
        name = "homepage-jazz$BRANCH_SUFFIX"
        port = "http"
        provider = "consul"
      }

      resources {
        cpu    = 100 # MHz
        memory = 300 # MB
      }
    }
  }
}
# deploy bump 4