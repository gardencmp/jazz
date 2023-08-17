job "example-todo$BRANCH_SUFFIX" {
  region     = "$REGION"
  datacenters = ["$REGION"]

  group "static" {
    // count = 3

    network {
      port "http" {
        to = 80
      }
    }

    constraint {
      attribute = "${node.class}"
      operator  = "="
      value     = "edge"
    }

    // spread {
    //   attribute = "${node.datacenter}"
    //   weight    = 100
    // }

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
        meta {
          public_name = "${BRANCH_SUBDOMAIN}example-todo"
        }
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