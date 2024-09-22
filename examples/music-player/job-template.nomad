job "example-musicPlayer$BRANCH_SUFFIX" {
  region     = "global"
  datacenters = ["*"]

  group "static" {
    count = 4

    network {
      port "http" {
        to = 80
      }
    }

    constraint {
      attribute = "${node.class}"
      operator  = "="
      value     = "mesh"
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
        name = "example-pets$BRANCH_SUFFIX"
        port = "http"
        provider = "consul"
      }

      resources {
        cpu    = 50 # MHz
        memory = 50 # MB
      }
    }
  }
}
# deploy bump 4